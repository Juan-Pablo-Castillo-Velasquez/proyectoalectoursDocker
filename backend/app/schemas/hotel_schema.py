from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import date


class CaracteristicaCreate(BaseModel):
    nombre_caracteristica: str = Field(..., min_length=1, max_length=100)


class CaracteristicaResponse(BaseModel):
    id_caracteristica: int
    nombre_caracteristica: str

    class Config:
        from_attributes = True


class TipoHabitacionCreate(BaseModel):
    nombre_tipo: str = Field(..., min_length=1, max_length=50)
    descripcion: Optional[str] = Field(None, max_length=200)
    capacidad_personas: int = Field(..., gt=0)


class TipoHabitacionResponse(BaseModel):
    id_tipo_habitacion: int
    nombre_tipo: str
    descripcion: Optional[str]
    capacidad_personas: int

    class Config:
        from_attributes = True


class HabitacionCreate(BaseModel):
    id_hotel: int
    id_tipo_habitacion: int
    numero_habitacion: str = Field(..., min_length=1, max_length=20)
    precio_noche: float = Field(..., ge=0)
    estado: str = Field(default="disponible")

    @field_validator("estado")
    @classmethod
    def validate_estado(cls, v):
        if v not in ["disponible", "ocupada", "mantenimiento"]:
            raise ValueError("estado debe ser: disponible, ocupada o mantenimiento")
        return v


class HabitacionUpdate(BaseModel):
    numero_habitacion: Optional[str] = None
    precio_noche: Optional[float] = Field(None, ge=0)
    estado: Optional[str] = None

    @field_validator("estado")
    @classmethod
    def validate_estado(cls, v):
        if v and v not in ["disponible", "ocupada", "mantenimiento"]:
            raise ValueError("estado debe ser: disponible, ocupada o mantenimiento")
        return v


class HabitacionResponse(BaseModel):
    id_habitacion: int
    id_hotel: int
    id_tipo_habitacion: int
    numero_habitacion: str
    precio_noche: float
    estado: str
    tipo_habitacion: Optional[TipoHabitacionResponse] = None

    class Config:
        from_attributes = True


class HotelCaracteristicaCreate(BaseModel):
    id_caracteristica: int
    disponible: bool = True


class HotelCaracteristicaResponse(BaseModel):
    id_hotel: int
    id_caracteristica: int
    disponible: bool
    caracteristica: Optional[CaracteristicaResponse] = None

    class Config:
        from_attributes = True


class HotelCreate(BaseModel):
    nombre_hotel: str = Field(..., min_length=1, max_length=100)
    calificacion: Optional[int] = Field(None, ge=1, le=5)
    direccion: Optional[str] = Field(None, max_length=255)
    ciudad: Optional[str] = Field(None, max_length=100)
    pais: Optional[str] = Field(None, max_length=100)
    codigo_postal: Optional[str] = Field(None, max_length=20)
    correo_electronico: Optional[str] = Field(None, max_length=100)
    telefono: Optional[str] = Field(None, max_length=20)


class HotelUpdate(BaseModel):
    nombre_hotel: Optional[str] = None
    calificacion: Optional[int] = Field(None, ge=1, le=5)
    direccion: Optional[str] = None
    ciudad: Optional[str] = None
    pais: Optional[str] = None
    codigo_postal: Optional[str] = None
    correo_electronico: Optional[str] = None
    telefono: Optional[str] = None


class HotelResponse(BaseModel):
    id_hotel: int
    nombre_hotel: str
    calificacion: Optional[int]
    direccion: Optional[str]
    ciudad: Optional[str]
    pais: Optional[str]
    codigo_postal: Optional[str]
    correo_electronico: Optional[str]
    telefono: Optional[str]
    # Reseñas reales de clientes (propiedades calculadas en el modelo Hotel a
    # partir de la tabla `resenas`) — nunca cifras inventadas en el frontend.
    total_resenas: int = 0
    calificacion_promedio: Optional[float] = None

    class Config:
        from_attributes = True


class HotelDetailResponse(HotelResponse):
    habitaciones: List[HabitacionResponse] = []
    hotel_caracteristicas: List[HotelCaracteristicaResponse] = []
