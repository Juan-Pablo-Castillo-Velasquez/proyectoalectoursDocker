from pydantic import BaseModel, Field
from typing import Optional


class ServicioCreate(BaseModel):
    nombre_servicio: str = Field(..., min_length=1, max_length=100)
    descripcion: Optional[str] = None
    id_categoria: Optional[int] = None
    id_destino: Optional[int] = None
    duracion_horas: Optional[float] = None
    precio_base: float = Field(..., ge=0)
    capacidad_maxima: int = Field(..., gt=0)


class ServicioUpdate(BaseModel):
    nombre_servicio: Optional[str] = None
    descripcion: Optional[str] = None
    id_categoria: Optional[int] = None
    id_destino: Optional[int] = None
    duracion_horas: Optional[float] = None
    precio_base: Optional[float] = Field(None, ge=0)
    capacidad_maxima: Optional[int] = Field(None, gt=0)


class ServicioResponse(BaseModel):
    id_servicio: int
    nombre_servicio: str
    descripcion: Optional[str] = None
    id_categoria: Optional[int] = None
    id_destino: Optional[int] = None
    duracion_horas: Optional[float] = None
    precio_base: float
    capacidad_maxima: int

    class Config:
        from_attributes = True


class CategoriaServicioResponse(BaseModel):
    id_categoria: int
    nombre_categoria: str

    class Config:
        from_attributes = True
