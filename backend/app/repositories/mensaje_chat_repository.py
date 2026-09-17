"""
Repositorio del chat privado admin<->cliente. Un solo hilo por cliente: no
hay tabla de "hilo" separada, el hilo de un cliente es "todos los
MensajeChat con ese id_cliente" -- ver app/models/mensaje_chat_model.py.
"""

from sqlalchemy import and_, func
from sqlalchemy.orm import Session

from app.models.cliente_model import Cliente
from app.models.mensaje_chat_model import MensajeChat
from app.models.user_model import Usuario


def _remitente_nombre_y_foto(db: Session, mensaje: MensajeChat) -> tuple[str, str | None]:
    """Nombre/foto reales de quien envió, según remitente_tipo -- nunca se
    inventa un nombre genérico ("Admin"): si el usuario remitente ya no
    existe (cuenta borrada), cae a un texto honesto en vez de romper."""
    usuario = db.query(Usuario).filter(Usuario.id_usuario == mensaje.id_usuario_remitente).first()
    if not usuario:
        return "Usuario eliminado", None
    if mensaje.remitente_tipo == "cliente" and usuario.cliente:
        return f"{usuario.cliente.nombre} {usuario.cliente.apellido}", usuario.foto_perfil
    return usuario.username, usuario.foto_perfil


def _a_response_dict(db: Session, mensaje: MensajeChat) -> dict:
    nombre, foto = _remitente_nombre_y_foto(db, mensaje)
    return {
        "id_mensaje": mensaje.id_mensaje,
        "id_cliente": mensaje.id_cliente,
        "id_usuario_remitente": mensaje.id_usuario_remitente,
        "remitente_tipo": mensaje.remitente_tipo,
        "contenido": mensaje.contenido,
        "imagen_url": mensaje.imagen_url,
        "leido": mensaje.leido,
        "fecha_envio": mensaje.fecha_envio,
        "remitente_nombre": nombre,
        "remitente_foto": foto,
    }


class MensajeChatRepository:
    @staticmethod
    def get_hilos(db: Session) -> list[dict]:
        """Bandeja compartida del admin: un cliente por fila (solo los que
        ya tienen al menos un mensaje), ordenados por fecha del último
        mensaje descendente, con su conteo de no-leídos (mensajes del
        propio cliente que ningún admin ha marcado como leídos todavía)."""
        ultimo_por_cliente = (
            db.query(
                MensajeChat.id_cliente,
                func.max(MensajeChat.id_mensaje).label("ultimo_id"),
            )
            .group_by(MensajeChat.id_cliente)
            .subquery()
        )

        filas = (
            db.query(MensajeChat, Cliente)
            .join(ultimo_por_cliente, MensajeChat.id_mensaje == ultimo_por_cliente.c.ultimo_id)
            .join(Cliente, Cliente.id_cliente == MensajeChat.id_cliente)
            .order_by(MensajeChat.fecha_envio.desc())
            .all()
        )

        resultado = []
        for ultimo_mensaje, cliente in filas:
            no_leidos = (
                db.query(func.count(MensajeChat.id_mensaje))
                .filter(
                    MensajeChat.id_cliente == cliente.id_cliente,
                    MensajeChat.remitente_tipo == "cliente",
                    MensajeChat.leido.is_(False),
                )
                .scalar()
            )
            resultado.append(
                {
                    "id_cliente": cliente.id_cliente,
                    "cliente_nombre": f"{cliente.nombre} {cliente.apellido}",
                    "cliente_foto": cliente.foto_perfil,
                    "ultimo_mensaje": ultimo_mensaje.contenido or ("📷 Imagen" if ultimo_mensaje.imagen_url else None),
                    "ultimo_mensaje_fecha": ultimo_mensaje.fecha_envio,
                    "no_leidos": no_leidos or 0,
                }
            )
        return resultado

    @staticmethod
    def get_mensajes(db: Session, id_cliente: int, after_id: int | None = None, limit: int = 50) -> list[dict]:
        """Sin after_id: los últimos `limit` mensajes del hilo, en orden
        cronológico ascendente (listos para renderizar de arriba a abajo).
        Con after_id: solo mensajes con id_mensaje > after_id -- es el
        contrato que usa el polling incremental del frontend, para no
        volver a traer todo el hilo cada 5 segundos."""
        query = db.query(MensajeChat).filter(MensajeChat.id_cliente == id_cliente)

        if after_id is not None:
            mensajes = query.filter(MensajeChat.id_mensaje > after_id).order_by(MensajeChat.id_mensaje.asc()).all()
        else:
            mensajes = query.order_by(MensajeChat.id_mensaje.desc()).limit(limit).all()
            mensajes.reverse()

        return [_a_response_dict(db, m) for m in mensajes]

    @staticmethod
    def crear_mensaje(
        db: Session,
        *,
        id_cliente: int,
        id_usuario_remitente: int,
        remitente_tipo: str,
        contenido: str | None,
        imagen_url: str | None,
    ) -> dict:
        mensaje = MensajeChat(
            id_cliente=id_cliente,
            id_usuario_remitente=id_usuario_remitente,
            remitente_tipo=remitente_tipo,
            contenido=contenido,
            imagen_url=imagen_url,
        )
        db.add(mensaje)
        db.commit()
        db.refresh(mensaje)
        return _a_response_dict(db, mensaje)

    @staticmethod
    def marcar_leido(db: Session, id_cliente: int, remitente_tipo_a_marcar: str) -> int:
        """Marca leido=True los mensajes de `remitente_tipo_a_marcar` (la
        OTRA parte de quien llama) para ese cliente -- nunca los propios.
        Devuelve cuántos se actualizaron."""
        actualizados = (
            db.query(MensajeChat)
            .filter(
                and_(
                    MensajeChat.id_cliente == id_cliente,
                    MensajeChat.remitente_tipo == remitente_tipo_a_marcar,
                    MensajeChat.leido.is_(False),
                )
            )
            .update({"leido": True})
        )
        db.commit()
        return actualizados

    @staticmethod
    def contar_no_leidos_admin(db: Session) -> int:
        """Suma de mensajes de tipo 'cliente' no leídos, en TODOS los
        hilos -- badge global del admin (bandeja compartida)."""
        total = (
            db.query(func.count(MensajeChat.id_mensaje))
            .filter(MensajeChat.remitente_tipo == "cliente", MensajeChat.leido.is_(False))
            .scalar()
        )
        return total or 0

    @staticmethod
    def contar_no_leidos_cliente(db: Session, id_cliente: int) -> int:
        """Mensajes de tipo 'admin' no leídos en el hilo propio de este
        cliente -- badge del tab "Mensajes" en su perfil."""
        total = (
            db.query(func.count(MensajeChat.id_mensaje))
            .filter(
                MensajeChat.id_cliente == id_cliente,
                MensajeChat.remitente_tipo == "admin",
                MensajeChat.leido.is_(False),
            )
            .scalar()
        )
        return total or 0
