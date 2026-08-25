from pydantic import BaseModel, Field
from typing import Optional
from datetime import date


class DestinoCreate(BaseModel):
    nombre_destino: str = Field(..., min_length=1, max_length=100)
    descripcion: Optional[str] = None
    ciudad: Optional[str] = Field(None, max_length=100)
    pais: Optional[str] = Field(None, max_length=100)
    temporada_alta_inicio: Optional[date] = None
    temporada_alta_fin: Optional[date] = None


class DestinoUpdate(BaseModel):
    nombre_destino: Optional[str] = None
    descripcion: Optional[str] = None
    ciudad: Optional[str] = None
    pais: Optional[str] = None
    temporada_alta_inicio: Optional[date] = None
    temporada_alta_fin: Optional[date] = None


class DestinoResponse(BaseModel):
    id_destino: int
    nombre_destino: str
    descripcion: Optional[str] = None
    ciudad: Optional[str] = None
    pais: Optional[str] = None
    temporada_alta_inicio: Optional[date] = None
    temporada_alta_fin: Optional[date] = None

    class Config:
        from_attributes = True


class DestinoSugerenciaResponse(BaseModel):
    id_destino: int
    nombre_destino: str
    ciudad: Optional[str] = None
    pais: Optional[str] = None

    class Config:
        from_attributes = True
