from sqlalchemy import Column, Integer, String, Boolean, Text, Date, TIMESTAMP, ForeignKey, CheckConstraint, Numeric
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Paquete(Base):
    __tablename__ = "paquetes"

    id_paquete = Column(Integer, primary_key=True, index=True)
    nombre_paquete = Column(String(100), nullable=False)
    descripcion = Column(Text)
    duracion_dias = Column(Integer)
    precio_base = Column(Numeric(10, 2), CheckConstraint("precio_base >= 0"), nullable=False)
    activo = Column(Boolean, default=True)

    paquete_servicios = relationship("PaqueteServicio", back_populates="paquete", cascade="all, delete-orphan")
    paquete_hotel = relationship("PaqueteHotel", back_populates="paquete", cascade="all, delete-orphan")
    reservas = relationship("Reserva", back_populates="paquete")


class PaqueteServicio(Base):
    __tablename__ = "paquete_servicios"

    id_paquete = Column(Integer, ForeignKey("paquetes.id_paquete", ondelete="CASCADE"), primary_key=True)
    id_servicio = Column(Integer, ForeignKey("servicios.id_servicio", ondelete="CASCADE"), primary_key=True)
    dia_actividad = Column(Integer)
    incluido = Column(Boolean, default=True)

    paquete = relationship("Paquete", back_populates="paquete_servicios")
    servicio = relationship("Servicio", back_populates="paquete_servicios")


class PaqueteHotel(Base):
    __tablename__ = "paquete_hotel"

    id_paquete = Column(Integer, ForeignKey("paquetes.id_paquete", ondelete="CASCADE"), primary_key=True)
    id_hotel = Column(Integer, ForeignKey("hoteles.id_hotel", ondelete="CASCADE"), primary_key=True)
    noches_incluidas = Column(Integer)

    paquete = relationship("Paquete", back_populates="paquete_hotel")
    hotel = relationship("Hotel")


class Reserva(Base):
    __tablename__ = "reservas"

    id_reserva = Column(Integer, primary_key=True, index=True)
    id_cliente = Column(Integer, ForeignKey("clientes.id_cliente"), nullable=False)
    id_empleado = Column(Integer, ForeignKey("empleados.id_empleado", ondelete="SET NULL"))
    id_paquete = Column(Integer, ForeignKey("paquetes.id_paquete", ondelete="SET NULL"))
    fecha_reserva = Column(TIMESTAMP, server_default=func.now())
    fecha_inicio = Column(Date)
    fecha_fin = Column(Date)
    numero_personas = Column(Integer, CheckConstraint("numero_personas > 0"), nullable=False)
    estado = Column(
        String(20),
        CheckConstraint("estado IN ('pendiente', 'confirmada', 'cancelada', 'finalizada')"),
        nullable=False
    )
    canal_origen = Column(
        String(20),
        CheckConstraint("canal_origen IN ('web', 'empleado', 'telefono')"),
        default='web'
    )

    cliente = relationship("Cliente", back_populates="reservas")
    empleado = relationship("Empleado", back_populates="reservas")
    paquete = relationship("Paquete", back_populates="reservas")
    reserva_habitaciones = relationship("ReservaHabitacion", back_populates="reserva", cascade="all, delete-orphan")
    reserva_servicios = relationship("ReservaServicio", back_populates="reserva", cascade="all, delete-orphan")
    pagos = relationship("Pago", back_populates="reserva")
    historial_reservas = relationship("HistorialReserva", back_populates="reserva", cascade="all, delete-orphan")
    solicitudes_cancelacion = relationship("SolicitudCancelacion", back_populates="reserva", cascade="all, delete-orphan")


class ReservaHabitacion(Base):
    __tablename__ = "reserva_habitaciones"

    id_reserva = Column(Integer, ForeignKey("reservas.id_reserva", ondelete="CASCADE"), primary_key=True)
    id_habitacion = Column(Integer, ForeignKey("habitaciones.id_habitacion"), primary_key=True)
    fecha_checkin = Column(Date)
    fecha_checkout = Column(Date)
    precio_acordado = Column(Numeric(10, 2))

    reserva = relationship("Reserva", back_populates="reserva_habitaciones")
    habitacion = relationship("Habitacion", back_populates="reserva_habitaciones")


class ReservaServicio(Base):
    __tablename__ = "reserva_servicios"

    id_reserva = Column(Integer, ForeignKey("reservas.id_reserva", ondelete="CASCADE"), primary_key=True)
    id_servicio = Column(Integer, ForeignKey("servicios.id_servicio"), primary_key=True)
    fecha_servicio = Column(Date)
    numero_personas = Column(Integer)
    precio_acordado = Column(Numeric(10, 2))

    reserva = relationship("Reserva", back_populates="reserva_servicios")
    servicio = relationship("Servicio", back_populates="reserva_servicios")


class MetodoPago(Base):
    __tablename__ = "metodos_pago"

    id_metodo = Column(Integer, primary_key=True, index=True)
    nombre_metodo = Column(String(50), nullable=False)

    pagos = relationship("Pago", back_populates="metodo_pago")


class Pago(Base):
    __tablename__ = "pagos"

    id_pago = Column(Integer, primary_key=True, index=True)
    id_reserva = Column(Integer, ForeignKey("reservas.id_reserva"), nullable=False)
    id_metodo_pago = Column(Integer, ForeignKey("metodos_pago.id_metodo"), nullable=False)
    monto = Column(Numeric(10, 2), CheckConstraint("monto >= 0"), nullable=False)
    fecha_pago = Column(TIMESTAMP, server_default=func.now())
    referencia = Column(String(100))
    estado = Column(
        String(20),
        CheckConstraint("estado IN ('pendiente', 'pagado', 'rechazado')"),
        nullable=False
    )

    reserva = relationship("Reserva", back_populates="pagos")
    metodo_pago = relationship("MetodoPago", back_populates="pagos")


class HistorialReserva(Base):
    __tablename__ = "historial_reservas"

    id_historial = Column(Integer, primary_key=True, index=True)
    id_reserva = Column(Integer, ForeignKey("reservas.id_reserva", ondelete="CASCADE"), nullable=False)
    estado_anterior = Column(String(20))
    estado_nuevo = Column(String(20))
    fecha_cambio = Column(TIMESTAMP, server_default=func.now())
    id_empleado_responsable = Column(Integer, ForeignKey("empleados.id_empleado", ondelete="SET NULL"))
    comentarios = Column(Text)

    reserva = relationship("Reserva", back_populates="historial_reservas")
    empleado_responsable = relationship("Empleado", back_populates="historial_reservas")


class SolicitudCancelacion(Base):
    """
    Solicitud de cancelación enviada por el cliente desde el modal
    'Solicitar cancelación'. Queda en estado 'pendiente' hasta que
    un asesor/admin la evalúa y la aprueba o rechaza.
    """
    __tablename__ = "solicitudes_cancelacion"

    id_solicitud = Column(Integer, primary_key=True, index=True)
    id_reserva = Column(Integer, ForeignKey("reservas.id_reserva", ondelete="CASCADE"), nullable=False)
    id_cliente = Column(Integer, ForeignKey("clientes.id_cliente", ondelete="CASCADE"), nullable=False)

    motivo = Column(String(100), nullable=False)
    motivo_detalle = Column(Text)

    estado = Column(
        String(20),
        CheckConstraint("estado IN ('pendiente', 'aprobada', 'rechazada')"),
        nullable=False,
        default="pendiente",
    )

    fecha_solicitud = Column(TIMESTAMP, server_default=func.now())
    fecha_resolucion = Column(TIMESTAMP)
    id_empleado_resolutor = Column(Integer, ForeignKey("empleados.id_empleado", ondelete="SET NULL"))
    comentario_resolucion = Column(Text)

    reserva = relationship("Reserva", back_populates="solicitudes_cancelacion")
    cliente = relationship("Cliente")
    empleado_resolutor = relationship("Empleado")