from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class NotificacionResponse(BaseModel):
    id_notificacion: int
    tipo: str
    titulo: str
    mensaje: Optional[str] = None
    id_referencia: Optional[int] = None
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
    mensaje: Optional[str] = None
    fecha: datetime
    id_referencia: int
