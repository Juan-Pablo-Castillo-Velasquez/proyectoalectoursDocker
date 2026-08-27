from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ConfiguracionCreate(BaseModel):
    clave: str
    valor: Optional[str] = None
    descripcion: Optional[str] = None


class ConfiguracionUpdate(BaseModel):
    valor: Optional[str] = None
    descripcion: Optional[str] = None


class ConfiguracionResponse(BaseModel):
    id_config: int
    clave: str
    valor: Optional[str] = None
    descripcion: Optional[str] = None
    actualizado_en: Optional[datetime] = None

    class Config:
        from_attributes = True
