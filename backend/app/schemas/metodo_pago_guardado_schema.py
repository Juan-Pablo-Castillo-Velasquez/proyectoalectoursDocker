from datetime import datetime

from pydantic import BaseModel, Field, field_validator


class MetodoPagoGuardadoCreate(BaseModel):
    alias: str = Field(..., min_length=1, max_length=50)
    tipo: str = Field(..., min_length=1, max_length=30)
    ultimos4: str | None = Field(None, min_length=4, max_length=4)
    # PIN de confirmación: nunca se guarda en texto plano, ver
    # MetodoPagoGuardado.clave_hash y metodo_pago_guardado_route.py
    clave: str = Field(..., min_length=4, max_length=6)
    predeterminado: bool = False

    @field_validator("ultimos4")
    @classmethod
    def validar_ultimos4(cls, v):
        if v is not None and not v.isdigit():
            raise ValueError("ultimos4 debe contener solo dígitos")
        return v

    @field_validator("clave")
    @classmethod
    def validar_clave(cls, v):
        if not v.isdigit():
            raise ValueError("La clave de confirmación debe ser numérica (4 a 6 dígitos)")
        return v


class MetodoPagoGuardadoResponse(BaseModel):
    id_metodo_guardado: int
    alias: str
    tipo: str
    ultimos4: str | None = None
    predeterminado: bool
    fecha_creacion: datetime | None = None

    class Config:
        from_attributes = True


class VerificarClaveRequest(BaseModel):
    clave: str = Field(..., min_length=4, max_length=6)


class VerificarClaveResponse(BaseModel):
    valido: bool
