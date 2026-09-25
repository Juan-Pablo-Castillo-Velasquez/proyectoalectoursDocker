"""
Chat privado admin<->cliente -- un solo hilo continuo por cliente (no uno
por reserva), con bandeja compartida: cualquier admin puede ver y
responder el hilo de cualquier cliente (no hay asignacion 1-a-1
admin<->cliente). No existe una tabla de "hilo" separada: el hilo de un
cliente es simplemente todos los MensajeChat con ese id_cliente, ordenados
por fecha_envio.

`leido` significa "no visto todavia por LA OTRA PARTE", nunca por quien lo
envio -- asi, contar no-leidos y marcar-como-leido siempre filtran por
remitente_tipo OPUESTO al rol que pregunta, sin necesitar una segunda
tabla de "lecturas por usuario" (ver MensajeChatRepository).

Un mensaje puede etiquetarse opcionalmente con la reserva de la que se
esta hablando (id_reserva, nullable) -- no cambia el diseño de "un solo
hilo por cliente": la reserva es solo una etiqueta sobre un mensaje del
MISMO hilo, nunca crea un hilo nuevo.
"""

from sqlalchemy import TIMESTAMP, Boolean, Column, ForeignKey, Index, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class MensajeChat(Base):
    __tablename__ = "mensajes_chat"

    id_mensaje = Column(Integer, primary_key=True, index=True)
    id_cliente = Column(Integer, ForeignKey("clientes.id_cliente", ondelete="CASCADE"), nullable=False, index=True)
    # Quien realmente escribio el mensaje -- puede ser cualquier admin (no
    # hay asignacion 1-a-1: cualquiera con rol admin puede responder
    # cualquier hilo) o el propio cliente. CASCADE porque un mensaje sin
    # remitente no tiene sentido -- misma convencion que las otras FKs
    # hacia usuarios.id_usuario (ver auth_model.py).
    id_usuario_remitente = Column(Integer, ForeignKey("usuarios.id_usuario", ondelete="CASCADE"), nullable=False)
    remitente_tipo = Column(String(20), nullable=False)  # "admin" | "cliente"
    contenido = Column(String, nullable=True)  # puede ser None si el mensaje es solo una imagen
    # URL de Cloudinary (https://...) o ruta local /uploads/chat/... segun
    # CLOUDINARY_URL este configurada o no -- ver guardar_imagen() en
    # app/core/image_storage.py, resuelto igual que foto_perfil/comprobante_url
    # (ver resolveFotoUrl en el frontend).
    imagen_url = Column(String, nullable=True)
    # Adjunto que NO es una imagen (por ahora solo PDF real, validado por
    # bytes de cabecera -- ver ARCHIVO_TIPOS_PERMITIDOS en
    # mensaje_chat_route.py) -- separado de imagen_url a propósito: el
    # frontend sigue mostrando imagen_url inline con <img>/lightbox exacto
    # como siempre, y renderiza archivo_url como una tarjeta de documento
    # descargable en vez de intentar pintarlo como imagen. Un mensaje nunca
    # tiene ambos a la vez (viene de un solo <input type="file"> por
    # mensaje, ver _guardar_archivo_chat).
    archivo_url = Column(String, nullable=True)
    # Nombre original del archivo (ej. "itinerario.pdf") -- guardar_imagen()
    # nombra el archivo en disco/Cloudinary con un uuid, así que sin esto
    # la tarjeta de descarga no tendría ningún nombre real que mostrar.
    archivo_nombre = Column(String, nullable=True)
    # Reserva de la que se esta hablando en este mensaje -- opcional, no
    # crea un hilo nuevo (sigue siendo "un solo hilo por cliente"). SET
    # NULL: si la reserva se borra, el mensaje sobrevive sin la etiqueta,
    # misma convencion que Reserva.id_empleado (FK opcional) en
    # reserva_model.py.
    id_reserva = Column(Integer, ForeignKey("reservas.id_reserva", ondelete="SET NULL"), nullable=True)
    leido = Column(Boolean, nullable=False, default=False)
    fecha_envio = Column(TIMESTAMP, server_default=func.now())

    cliente = relationship("Cliente")
    remitente = relationship("Usuario")
    reserva = relationship("Reserva")

    __table_args__ = (
        # Cubre tanto "contar no-leidos de tipo X para este cliente" como
        # "marcar leidos los de tipo X de este cliente" -- la consulta mas
        # frecuente de este modulo (corre en cada ciclo de polling).
        Index("ix_mensajes_chat_cliente_tipo_leido", "id_cliente", "remitente_tipo", "leido"),
    )
