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
    leido = Column(Boolean, nullable=False, default=False)
    fecha_envio = Column(TIMESTAMP, server_default=func.now())

    cliente = relationship("Cliente")
    remitente = relationship("Usuario")

    __table_args__ = (
        # Cubre tanto "contar no-leidos de tipo X para este cliente" como
        # "marcar leidos los de tipo X de este cliente" -- la consulta mas
        # frecuente de este modulo (corre en cada ciclo de polling).
        Index("ix_mensajes_chat_cliente_tipo_leido", "id_cliente", "remitente_tipo", "leido"),
    )
