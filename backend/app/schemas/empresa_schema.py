from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional
from datetime import datetime

ESTADOS_VALIDOS = ["nuevo", "contactado", "cerrado", "descartado"]


class SolicitudCorporativaCreate(BaseModel):
    nombre_empresa: str = Field(..., min_length=2, max_length=150)
    numero_empleados: Optional[str] = None
    nombre_contacto: str = Field(..., min_length=2, max_length=100)
    email_corporativo: EmailStr
    telefono: str = Field(..., min_length=6, max_length=30)
    mensaje: Optional[str] = Field(None, max_length=2000)


class SolicitudCorporativaUpdate(BaseModel):
    estado: str

    @field_validator("estado")
    @classmethod
    def validate_estado(cls, v):
        if v not in ESTADOS_VALIDOS:
            raise ValueError(f"estado debe ser uno de: {', '.join(ESTADOS_VALIDOS)}")
        return v


class SolicitudCorporativaResponse(BaseModel):
    id_solicitud: int
    nombre_empresa: str
    numero_empleados: Optional[str] = None
    nombre_contacto: str
    email_corporativo: str
    telefono: str
    mensaje: Optional[str] = None
    estado: str
    fecha_creacion: datetime

    class Config:
        from_attributes = True
