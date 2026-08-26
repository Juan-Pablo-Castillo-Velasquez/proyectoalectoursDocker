# Importar todos los modelos aquí para asegurar que SQLAlchemy los registre
from app.models.user_model import Usuario
from app.models.cliente_model import Cliente, Empleado, PreferenciaCliente
from app.models.auth_model import Rol, UsuarioRol, SesionUsuario, RecuperacionPassword
from app.models.hotel_model import Hotel, Habitacion, Caracteristica, HotelCaracteristica, TipoHabitacion
from app.models.servicio_model import Servicio, Destino, CategoriaServicio, Proveedor, ServicioProveedor
from app.models.reserva_model import (
    Reserva, Paquete, Pago, MetodoPago, HistorialReserva,
    ReservaHabitacion, ReservaServicio, PaqueteServicio, PaqueteHotel
)
from app.models.favorito_model import Favorito

__all__ = [
    "Usuario",
    "Cliente",
    "Empleado",
    "PreferenciaCliente",
    "Hotel",
    "Habitacion",
    "Caracteristica",
    "HotelCaracteristica",
    "TipoHabitacion",
    "Servicio",
    "Destino",
    "CategoriaServicio",
    "Proveedor",
    "ServicioProveedor",
    "Reserva",
    "Paquete",
    "Pago",
    "MetodoPago",
    "HistorialReserva",
    "ReservaHabitacion",
    "ReservaServicio",
    "PaqueteServicio",
    "PaqueteHotel",
    "Rol",
    "UsuarioRol",
    "SesionUsuario",
    "RecuperacionPassword",
    "Favorito",
]
