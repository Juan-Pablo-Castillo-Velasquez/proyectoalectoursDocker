from sqlalchemy import Column, Integer, String, Boolean, TIMESTAMP, ForeignKey, CheckConstraint, UniqueConstraint, Numeric
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Hotel(Base):
    __tablename__ = "hoteles"

    id_hotel = Column(Integer, primary_key=True, index=True)
    nombre_hotel = Column(String(100), nullable=False)
    calificacion = Column(Integer, CheckConstraint("calificacion BETWEEN 1 AND 5"))
    direccion = Column(String(255))
    ciudad = Column(String(100))
    pais = Column(String(100))
    codigo_postal = Column(String(20))
    correo_electronico = Column(String(100))
    telefono = Column(String(20))

    habitaciones = relationship("Habitacion", back_populates="hotel", cascade="all, delete-orphan")
    hotel_caracteristicas = relationship("HotelCaracteristica", back_populates="hotel", cascade="all, delete-orphan")
    resenas = relationship("Resena", back_populates="hotel")

    @property
    def total_resenas(self) -> int:
        """Cantidad real de reseñas de clientes que dejaron este hotel —
        usado para mostrar información comercial real (ej. "4.6 (23 reseñas)")
        en vez de conteos inventados en las tarjetas de hotel."""
        return len(self.resenas)

    @property
    def calificacion_promedio(self):
        """Promedio real de calificación de clientes (1-5, de la tabla
        `resenas`), distinto de `calificacion` (categoría/estrellas fijada
        por el hotel). None si todavía no hay ninguna reseña real — el
        frontend debe usar `calificacion` como respaldo en ese caso, nunca
        inventar un promedio."""
        if not self.resenas:
            return None
        return round(sum(r.calificacion for r in self.resenas) / len(self.resenas), 1)


class Caracteristica(Base):
    __tablename__ = "caracteristicas_hotel"

    id_caracteristica = Column(Integer, primary_key=True, index=True)
    nombre_caracteristica = Column(String(100), unique=True, nullable=False)

    hotel_caracteristicas = relationship("HotelCaracteristica", back_populates="caracteristica", cascade="all, delete-orphan")


class HotelCaracteristica(Base):
    __tablename__ = "hotel_caracteristicas"

    id_hotel = Column(Integer, ForeignKey("hoteles.id_hotel", ondelete="CASCADE"), primary_key=True)
    id_caracteristica = Column(Integer, ForeignKey("caracteristicas_hotel.id_caracteristica", ondelete="CASCADE"), primary_key=True)
    disponible = Column(Boolean, default=True)

    hotel = relationship("Hotel", back_populates="hotel_caracteristicas")
    caracteristica = relationship("Caracteristica", back_populates="hotel_caracteristicas")


class TipoHabitacion(Base):
    __tablename__ = "tipo_habitacion"

    id_tipo_habitacion = Column(Integer, primary_key=True, index=True)
    nombre_tipo = Column(String(50), nullable=False)
    descripcion = Column(String(200))
    capacidad_personas = Column(Integer, nullable=False)

    habitaciones = relationship("Habitacion", back_populates="tipo_habitacion")


class Habitacion(Base):
    __tablename__ = "habitaciones"

    id_habitacion = Column(Integer, primary_key=True, index=True)
    id_hotel = Column(Integer, ForeignKey("hoteles.id_hotel", ondelete="CASCADE"), nullable=False)
    id_tipo_habitacion = Column(Integer, ForeignKey("tipo_habitacion.id_tipo_habitacion"), nullable=False)
    numero_habitacion = Column(String(20), nullable=False)
    precio_noche = Column(Numeric(10, 2), CheckConstraint("precio_noche >= 0"), nullable=False)
    estado = Column(String(20), CheckConstraint("estado IN ('disponible', 'ocupada', 'mantenimiento')"), nullable=False)

    hotel = relationship("Hotel", back_populates="habitaciones")
    tipo_habitacion = relationship("TipoHabitacion", back_populates="habitaciones")
    reserva_habitaciones = relationship("ReservaHabitacion", back_populates="habitacion")

    __table_args__ = (
        UniqueConstraint('id_hotel', 'numero_habitacion', name='uq_hotel_numero'),
    )