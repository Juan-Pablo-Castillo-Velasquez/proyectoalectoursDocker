from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import date, datetime


class PaqueteHotelInput(BaseModel):
    """Un hotel real vinculado al paquete (tabla paquete_hotel, ya existía
    en el modelo pero nunca se podía escribir desde el admin — ver
    PaqueteRepository._sync_hoteles en reserva_repository.py)."""
    id_hotel: int
    noches_incluidas: Optional[int] = Field(None, gt=0)


class PaqueteCreate(BaseModel):
    nombre_paquete: str = Field(..., min_length=1, max_length=100)
    descripcion: Optional[str] = None
    duracion_dias: Optional[int] = Field(None, gt=0)
    precio_base: float = Field(..., ge=0)
    activo: bool = True
    hoteles: Optional[List[PaqueteHotelInput]] = None


class PaqueteUpdate(BaseModel):
    nombre_paquete: Optional[str] = None
    descripcion: Optional[str] = None
    duracion_dias: Optional[int] = Field(None, gt=0)
    precio_base: Optional[float] = Field(None, ge=0)
    activo: Optional[bool] = None
    # None = no se mandó, no tocar los hoteles ya vinculados (mismo patrón
    # de exclude_unset ya usado para reactivar solo con {activo: true});
    # [] = sí se mandó, y significa "quitar todos los hoteles".
    hoteles: Optional[List[PaqueteHotelInput]] = None


class PaqueteResponse(BaseModel):
    id_paquete: int
    nombre_paquete: str
    descripcion: Optional[str]
    duracion_dias: Optional[int]
    precio_base: float
    activo: bool

    class Config:
        from_attributes = True


class PaqueteHotelDetalle(BaseModel):
    id_hotel: int
    nombre_hotel: str
    ciudad: Optional[str] = None
    pais: Optional[str] = None
    calificacion: Optional[int] = None
    noches_incluidas: Optional[int] = None
    caracteristicas: List[str] = []


class PaqueteServicioDetalle(BaseModel):
    nombre_servicio: str
    categoria: Optional[str] = None
    descripcion: Optional[str] = None
    dia_actividad: Optional[int] = None
    incluido: bool = True


class PaqueteDetalleResponse(PaqueteResponse):
    """PaqueteResponse enriquecido con destinos, hoteles y servicios reales
    — usado por GET /paquetes/{id}/detalle para la página de detalle del
    frontend, que antes mostraba datos de ejemplo hardcodeados en
    data/packages.ts (nombres de hoteles, vuelos y horarios inventados)."""
    destinos: List[str] = []
    hoteles: List[PaqueteHotelDetalle] = []
    servicios: List[PaqueteServicioDetalle] = []


class MetodoPagoCreate(BaseModel):
    nombre_metodo: str = Field(..., min_length=1, max_length=50)


class MetodoPagoResponse(BaseModel):
    id_metodo: int
    nombre_metodo: str
    codigo: str

    class Config:
        from_attributes = True


# ===================== NUEVO: Habitación dentro de una reserva =====================

class HabitacionReservaCreate(BaseModel):
    """Una habitación específica que el cliente quiere reservar dentro de la reserva."""
    id_habitacion: int
    fecha_checkin: date
    fecha_checkout: date

    @field_validator("fecha_checkout")
    @classmethod
    def validate_fechas_habitacion(cls, v, info):
        if "fecha_checkin" in info.data and v <= info.data["fecha_checkin"]:
            raise ValueError("fecha_checkout debe ser posterior a fecha_checkin")
        return v


class HabitacionReservaResponse(BaseModel):
    id_habitacion: int
    fecha_checkin: date
    fecha_checkout: date
    precio_acordado: Optional[float] = None

    class Config:
        from_attributes = True


class ReservaCreate(BaseModel):
    id_cliente: int
    id_empleado: Optional[int] = None
    id_paquete: Optional[int] = None
    fecha_inicio: date
    fecha_fin: date
    numero_personas: int = Field(..., gt=0)
    # NUEVO: habitaciones reales que se están reservando (precio se calcula en backend, no se confía en el frontend)
    habitaciones: Optional[List[HabitacionReservaCreate]] = None

    @field_validator("fecha_fin")
    @classmethod
    def validate_fechas(cls, v, info):
        if "fecha_inicio" in info.data and v <= info.data["fecha_inicio"]:
            raise ValueError("fecha_fin debe ser posterior a fecha_inicio")
        return v


class ReservaUpdate(BaseModel):
    id_paquete: Optional[int] = None
    fecha_inicio: Optional[date] = None
    fecha_fin: Optional[date] = None
    numero_personas: Optional[int] = Field(None, gt=0)
    estado: Optional[str] = None

    @field_validator("estado")
    @classmethod
    def validate_estado(cls, v):
        if v and v not in ["pendiente", "confirmada", "cancelada", "finalizada"]:
            raise ValueError("estado debe ser: pendiente, confirmada, cancelada o finalizada")
        return v


class ReservaResponse(BaseModel):
    id_reserva: int
    id_cliente: int
    id_empleado: Optional[int]
    id_paquete: Optional[int]
    fecha_reserva: datetime
    fecha_inicio: date
    fecha_fin: date
    numero_personas: int
    estado: str
    precio_total: float = 0
    # Nombre del paquete y destino (ciudad/país del hotel), calculados en
    # Reserva.nombre_paquete / Reserva.destino — para que el historial de
    # reservas del frontend no tenga que mostrar solo el id_paquete crudo.
    nombre_paquete: Optional[str] = None
    destino: Optional[str] = None
    # Nombre del hotel — respaldo para cuando la reserva no tiene paquete
    # (reserva directa de habitación, id_paquete nulo): ver Reserva.hotel_nombre.
    hotel_nombre: Optional[str] = None
    # Fecha del último cambio de estado registrado en historial_reservas (o
    # fecha_reserva si aún no hay historial) — ver Reserva.fecha_ultima_actualizacion.
    # Usado por la columna "Última actualización" del panel de admin.
    fecha_ultima_actualizacion: Optional[datetime] = None
    # BUG real corregido: esta columna ya existía en el modelo (Reserva.canal_origen)
    # pero solo se exponía en ReservaDetailResponse, nunca en la lista base — el
    # resultado era que GET /reservas (el que usa la tabla del panel de admin)
    # siempre mandaba canal_origen=None, y el frontend lo interpretaba como "web"
    # para TODAS las filas sin importar el valor real en la base de datos.
    canal_origen: Optional[str] = None

    class Config:
        from_attributes = True


class PagoCreate(BaseModel):
    id_reserva: int
    id_metodo_pago: int
    monto: float = Field(..., ge=0)
    referencia: Optional[str] = Field(None, max_length=100)


class PagoUpdate(BaseModel):
    monto: Optional[float] = Field(None, ge=0)
    referencia: Optional[str] = None
    estado: Optional[str] = None

    @field_validator("estado")
    @classmethod
    def validate_estado(cls, v):
        if v and v not in ["pendiente", "procesando", "pagado", "rechazado", "cancelado"]:
            raise ValueError("estado debe ser: pendiente, procesando, pagado, rechazado o cancelado")
        return v


class PagoResponse(BaseModel):
    id_pago: int
    id_reserva: int
    id_metodo_pago: int
    monto: float
    fecha_pago: datetime
    referencia: Optional[str]
    estado: str
    numero_factura: Optional[str] = None
    comprobante_url: Optional[str] = None
    metodo_pago: Optional[MetodoPagoResponse] = None

    class Config:
        from_attributes = True


class AsesorResponse(BaseModel):
    """Datos mínimos del empleado asignado a la reserva (sin cédula ni
    fecha de contratación — esto lo ve el cliente en el popup de su reserva)."""
    id_empleado: int
    nombre: str
    apellido: str
    correo_electronico: Optional[str] = None
    celular: Optional[str] = None

    class Config:
        from_attributes = True


class PagarRequest(BaseModel):
    id_metodo_pago: int
    tipo_pago: str = "completo"

    # Campos especificos por metodo — nunca se envia el numero completo de
    # tarjeta ni datos sensibles reales, todo esto es simulado:
    ultimos4: Optional[str] = Field(None, max_length=4, min_length=4)   # tarjeta
    celular: Optional[str] = Field(None, max_length=15)                 # nequi
    banco: Optional[str] = Field(None, max_length=100)                  # pse
    documento: Optional[str] = Field(None, max_length=20)               # pse

    @field_validator("tipo_pago")
    @classmethod
    def validate_tipo_pago(cls, v):
        if v not in ("completo", "parcial"):
            raise ValueError("tipo_pago debe ser: completo o parcial")
        return v


class PagarResponse(BaseModel):
    pago: PagoResponse
    reserva: ReservaResponse


class ReservaDetailResponse(ReservaResponse):
    paquete: Optional[PaqueteResponse] = None
    pagos: List[PagoResponse] = []
    # OJO: el modelo SQLAlchemy llama a esta relación "reserva_habitaciones", por eso el alias.
    habitaciones: List[HabitacionReservaResponse] = Field(default=[], validation_alias="reserva_habitaciones")
    empleado: Optional[AsesorResponse] = None
    # canal_origen ya viene heredado de ReservaResponse (ver arriba) — se
    # quitó la redeclaración duplicada que había acá.

    class Config:
        from_attributes = True
        populate_by_name = True