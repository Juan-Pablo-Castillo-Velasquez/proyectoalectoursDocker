from datetime import datetime

from pydantic import BaseModel


class NotificacionResponse(BaseModel):
    id_notificacion: int
    tipo: str
    titulo: str
    mensaje: str | None = None
    id_referencia: int | None = None
    leido: bool
    fecha_creacion: datetime

    class Config:
        from_attributes = True


class ActividadClienteItem(BaseModel):
    """Item del feed de notificaciones del cliente autenticado (campana del
    sitio público) — a diferencia de Notificacion (100% interna del admin,
    sin id_cliente), esto NO es una fila persistida: se arma al vuelo
    agregando historial_reservas y solicitudes_cancelacion de ESE cliente.
    Ver notificacion_service.get_actividad_cliente."""

    tipo: str
    titulo: str
    mensaje: str | None = None
    fecha: datetime
    id_referencia: int
