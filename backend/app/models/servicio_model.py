from sqlalchemy import Boolean, CheckConstraint, Column, Date, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import relationship

from app.core.database import Base


class Destino(Base):
    __tablename__ = "destinos"

    id_destino = Column(Integer, primary_key=True, index=True)
    nombre_destino = Column(String(100), nullable=False)
    descripcion = Column(Text)
    ciudad = Column(String(100))
    pais = Column(String(100))
    temporada_alta_inicio = Column(Date)
    temporada_alta_fin = Column(Date)

    servicios = relationship("Servicio", back_populates="destino")


class CategoriaServicio(Base):
    __tablename__ = "categoria_servicio"

    id_categoria = Column(Integer, primary_key=True, index=True)
    nombre_categoria = Column(String(100), nullable=False)

    servicios = relationship("Servicio", back_populates="categoria")


class Servicio(Base):
    __tablename__ = "servicios"

    id_servicio = Column(Integer, primary_key=True, index=True)
    nombre_servicio = Column(String(100), nullable=False)
    descripcion = Column(Text)
    id_categoria = Column(Integer, ForeignKey("categoria_servicio.id_categoria"))
    id_destino = Column(Integer, ForeignKey("destinos.id_destino"))
    duracion_horas = Column(Numeric(4, 1))
    precio_base = Column(Numeric(10, 2), CheckConstraint("precio_base >= 0"), nullable=False)
    capacidad_maxima = Column(Integer, CheckConstraint("capacidad_maxima > 0"), nullable=False)

    categoria = relationship("CategoriaServicio", back_populates="servicios")
    destino = relationship("Destino", back_populates="servicios")
    servicio_proveedor = relationship("ServicioProveedor", back_populates="servicio")
    paquete_servicios = relationship("PaqueteServicio", back_populates="servicio")
    reserva_servicios = relationship("ReservaServicio", back_populates="servicio")


class Proveedor(Base):
    __tablename__ = "proveedores"

    id_proveedor = Column(Integer, primary_key=True, index=True)
    nombre_proveedor = Column(String(100), nullable=False)
    tipo_proveedor = Column(String(50))
    contacto = Column(String(100))
    telefono = Column(String(20))
    correo_electronico = Column(String(100))
    direccion = Column(String(255))
    ciudad = Column(String(100))
    pais = Column(String(100))
    comision_porcentaje = Column(Numeric(5, 2))

    servicio_proveedor = relationship("ServicioProveedor", back_populates="proveedor")


class ServicioProveedor(Base):
    __tablename__ = "servicio_proveedor"

    id_servicio = Column(Integer, ForeignKey("servicios.id_servicio", ondelete="CASCADE"), primary_key=True)
    id_proveedor = Column(Integer, ForeignKey("proveedores.id_proveedor", ondelete="CASCADE"), primary_key=True)
    precio_proveedor = Column(Numeric(10, 2))
    es_proveedor_principal = Column(Boolean, default=False)

    servicio = relationship("Servicio", back_populates="servicio_proveedor")
    proveedor = relationship("Proveedor", back_populates="servicio_proveedor")
