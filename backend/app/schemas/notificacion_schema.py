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
