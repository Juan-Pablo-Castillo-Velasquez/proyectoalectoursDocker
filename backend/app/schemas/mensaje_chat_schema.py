from datetime import datetime

from pydantic import BaseModel


class MensajeChatResponse(BaseModel):
    id_mensaje: int
    id_cliente: int
    id_usuario_remitente: int
    remitente_tipo: str
    contenido: str | None = None
    imagen_url: str | None = None
    leido: bool
    fecha_envio: datetime | None = None
    # Denormalizados para la UI (resueltos en el repositorio, no acá --
    # nunca se calculan en el schema, mismo criterio que el resto del
    # proyecto: el schema solo declara la forma de salida).
    remitente_nombre: str | None = None
    remitente_foto: str | None = None

    class Config:
        from_attributes = True


class HiloResumenResponse(BaseModel):
    """Una fila por cliente en la bandeja compartida del admin (ver
    MensajeChatRepository.get_hilos) -- no existe una tabla de "hilo", esto
    se deriva agregando mensajes_chat por id_cliente."""

    id_cliente: int
    cliente_nombre: str
    cliente_foto: str | None = None
    ultimo_mensaje: str | None = None
    ultimo_mensaje_fecha: datetime | None = None
    no_leidos: int


class ConteoNoLeidosResponse(BaseModel):
    no_leidos: int
