# Guardar como: backend/app/schemas/solicitud_cancelacion_schema.py

from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime


# Debe coincidir con el array MOTIVOS del modal en TabReservas.tsx
MOTIVOS_VALIDOS = [
    "Cambio de planes personales",
    "Problema económico",
    "Emergencia médica o familiar",
    "Error al hacer la reserva",
    "Encontré una mejor opción",
    "Otro motivo",
]


class SolicitudCancelacionCreate(BaseModel):
    motivo: str = Field(..., min_length=1, max_length=100)
    # Solo obligatorio cuando motivo == "Otro motivo" (se valida en el service)
    motivo_detalle: Optional[str] = Field(None, max_length=1000)

    @field_validator("motivo")
    @classmethod
    def validar_motivo(cls, v):
        if v not in MOTIVOS_VALIDOS:
            raise ValueError(f"motivo debe ser uno de: {', '.join(MOTIVOS_VALIDOS)}")
        return v


class SolicitudCancelacionResponse(BaseModel):
    id_solicitud: int
    id_reserva: int
    id_cliente: int
    motivo: str
    motivo_detalle: Optional[str] = None
    estado: str
    fecha_solicitud: datetime
    fecha_resolucion: Optional[datetime] = None
    comentario_resolucion: Optional[str] = None

    class Config:
        from_attributes = True


class SolicitudCancelacionResolve(BaseModel):
    estado: str = Field(..., description="'aprobada' o 'rechazada'")
    comentario_resolucion: Optional[str] = Field(None, max_length=1000)

    @field_validator("estado")
    @classmethod
    def validar_estado(cls, v):
        if v not in ("aprobada", "rechazada"):
            raise ValueError("estado debe ser 'aprobada' o 'rechazada'")
        return v