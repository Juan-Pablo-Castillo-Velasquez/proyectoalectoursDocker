from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional

class ReservaHabitacionDetail(BaseModel):
    id_habitacion: int
    numero_habitacion: str
    nombre_tipo: str
    nombre_hotel: str
    fecha_checkin: Optional[date] = None
    fecha_checkout: Optional[date] = None
    precio_acordado: Optional[float] = None
    precio_noche: float
    estado: str

    class Config:
        from_attributes = True

class ReservaServicioDetail(BaseModel):
    id_servicio: int
    nombre_servicio: str
    descripcion: Optional[str] = None
    duracion_horas: Optional[float] = None
    nombre_categoria: Optional[str] = None
    fecha_servicio: Optional[date] = None
    numero_personas: Optional[int] = None
    precio_acordado: Optional[float] = None

    class Config:
        from_attributes = True

class ReservaHistorialDetail(BaseModel):
    id_historial: int
    estado_anterior: Optional[str] = None
    estado_nuevo: Optional[str] = None
    fecha_cambio: datetime
    comentarios: Optional[str] = None
    nombre_empleado: Optional[str] = None

    class Config:
        from_attributes = True

class ActividadRecienteItem(BaseModel):
    """Un ítem del feed de 'Actividad reciente' del Dashboard de admin —
    igual que ReservaHistorialDetail pero con id_reserva incluido, porque
    acá se listan cambios de MUCHAS reservas mezcladas (no una sola, donde
    el id ya se sabe por la URL)."""
    id_historial: int
    id_reserva: int
    estado_anterior: Optional[str] = None
    estado_nuevo: Optional[str] = None
    fecha_cambio: datetime
    comentarios: Optional[str] = None
    nombre_empleado: Optional[str] = None

    class Config:
        from_attributes = True
