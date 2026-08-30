"""
Test suite for DELETE exception handling with foreign key constraints
"""

from datetime import date

import pytest
import sqlalchemy as sa
from sqlalchemy import ARRAY, create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.core.exceptions import (
    ClienteDependencyError,
    HotelDependencyError,
    NotFoundError,
    PaqueteDependencyError,
)
from app.models.cliente_model import Cliente
from app.models.hotel_model import Habitacion, Hotel
from app.models.reserva_model import Paquete, Reserva

# Registra en el mapper de SQLAlchemy TODOS los modelos que tienen alguna
# relationship() apuntando a ellos por nombre de clase (ej. Hotel.resenas =
# relationship("Resena", ...)) — sin este import, configurar cualquier
# mapper (create_all, o la primera query) falla con "failed to locate a
# name" porque SQLAlchemy nunca llegó a ver esa clase. Mismo motivo por el
# que app/main.py importa todos los modelos antes de arrancar la app real
# (ver el comentario ahí). Bug real encontrado: esta suite completa
# (los únicos tests que corre el CI) fallaba 100% por este motivo antes de
# este fix — Fase 1 del plan de mejora.
from app.repositories.cliente_repository import ClienteRepository
from app.repositories.hotel_repository import HotelRepository
from app.repositories.reserva_repository import PaqueteRepository

# Use in-memory SQLite for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# SQLite no soporta ARRAY. Se usa en preferencias_cliente.intereses (ARRAY(String)
# genérico de sqlalchemy, no el de postgresql.dialects). Lo cambiamos a JSON
# solo para este motor de pruebas en memoria.
for table in Base.metadata.tables.values():
    for column in table.columns:
        if isinstance(column.type, ARRAY):
            column.type = sa.JSON()

Base.metadata.create_all(bind=engine)


@pytest.fixture
def db():
    """Create a fresh database for each test"""
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    yield session
    session.close()
    Base.metadata.drop_all(bind=engine)


class TestHotelDeletionExceptions:
    """Test hotel deletion with dependencies"""

    def test_delete_hotel_without_dependencies(self, db):
        """Should succeed when hotel has no dependencies"""
        hotel = Hotel(
            nombre_hotel="Hotel Test",
            direccion="Calle 1",
            telefono="123456",
            correo_electronico="test@hotel.com",
            calificacion=4,
        )
        db.add(hotel)
        db.commit()

        result = HotelRepository.delete(db, hotel.id_hotel)
        assert result is not None

    def test_delete_hotel_with_habitaciones(self, db):
        """Should raise HotelDependencyError when hotel has habitaciones"""
        hotel = Hotel(
            nombre_hotel="Hotel Test",
            direccion="Calle 1",
            telefono="123456",
            correo_electronico="test@hotel.com",
            calificacion=4,
        )
        db.add(hotel)
        db.commit()

        # Add a habitacion
        habitacion = Habitacion(
            id_hotel=hotel.id_hotel, id_tipo_habitacion=1, numero_habitacion="101", precio_noche=50, estado="disponible"
        )
        db.add(habitacion)
        db.commit()

        # Try to delete hotel with dependencies
        with pytest.raises(HotelDependencyError) as exc_info:
            HotelRepository.delete(db, hotel.id_hotel)

        assert "habitación" in exc_info.value.detail.lower()
        assert exc_info.value.status_code == 409

    def test_delete_non_existent_hotel(self, db):
        """Should raise NotFoundError when hotel doesn't exist"""
        with pytest.raises(NotFoundError) as exc_info:
            HotelRepository.delete(db, 9999)

        assert "no encontrado" in exc_info.value.detail.lower()
        assert exc_info.value.status_code == 404


class TestClienteDeletionExceptions:
    """Test cliente deletion with dependencies"""

    def test_delete_cliente_without_dependencies(self, db):
        """Should succeed when cliente has no reservas"""
        cliente = Cliente(nombre="Juan", apellido="Pérez", cedula="12345678", correo="juan@test.com", celular="123456")
        db.add(cliente)
        db.commit()

        result = ClienteRepository.delete(db, cliente.id_cliente)
        assert result is not None

    def test_delete_cliente_with_reservas(self, db):
        """Should raise ClienteDependencyError when cliente has reservas"""
        # Create cliente
        cliente = Cliente(nombre="Juan", apellido="Pérez", cedula="12345678", correo="juan@test.com", celular="123456")
        db.add(cliente)
        db.commit()

        # Create paquete
        paquete = Paquete(
            nombre_paquete="Paquete Test", descripcion="Test", precio_base=100, duracion_dias=7, activo=True
        )
        db.add(paquete)
        db.commit()

        # Create reserva for this cliente
        reserva = Reserva(
            id_cliente=cliente.id_cliente,
            id_paquete=paquete.id_paquete,
            fecha_inicio=date(2024, 12, 1),
            fecha_fin=date(2024, 12, 8),
            numero_personas=2,
            estado="pendiente",
        )
        db.add(reserva)
        db.commit()

        # Try to delete cliente with reservas
        with pytest.raises(ClienteDependencyError) as exc_info:
            ClienteRepository.delete(db, cliente.id_cliente)

        assert "reserva" in exc_info.value.detail.lower()
        assert exc_info.value.status_code == 409

    def test_delete_non_existent_cliente(self, db):
        """Should raise NotFoundError when cliente doesn't exist"""
        with pytest.raises(NotFoundError) as exc_info:
            ClienteRepository.delete(db, 9999)

        assert "no encontrado" in exc_info.value.detail.lower()
        assert exc_info.value.status_code == 404


class TestPaqueteDeletionExceptions:
    """Test paquete deletion with dependencies"""

    def test_delete_paquete_without_dependencies(self, db):
        """Should succeed when paquete has no reservas"""
        paquete = Paquete(
            nombre_paquete="Paquete Test", descripcion="Test", precio_base=100, duracion_dias=7, activo=True
        )
        db.add(paquete)
        db.commit()

        result = PaqueteRepository.delete(db, paquete.id_paquete)
        assert result is not None
        # Should be marked as inactive
        assert not result.activo

    def test_delete_paquete_with_reservas(self, db):
        """Should raise PaqueteDependencyError when paquete has reservas"""
        # Create paquete
        paquete = Paquete(
            nombre_paquete="Paquete Test", descripcion="Test", precio_base=100, duracion_dias=7, activo=True
        )
        db.add(paquete)
        db.commit()

        # Create cliente
        cliente = Cliente(nombre="Juan", apellido="Pérez", cedula="12345678", correo="juan@test.com", celular="123456")
        db.add(cliente)
        db.commit()

        # Create reserva using this paquete
        reserva = Reserva(
            id_cliente=cliente.id_cliente,
            id_paquete=paquete.id_paquete,
            fecha_inicio=date(2024, 12, 1),
            fecha_fin=date(2024, 12, 8),
            numero_personas=2,
            estado="pendiente",
        )
        db.add(reserva)
        db.commit()

        # Try to delete paquete with reservas
        with pytest.raises(PaqueteDependencyError) as exc_info:
            PaqueteRepository.delete(db, paquete.id_paquete)

        assert "reserva" in exc_info.value.detail.lower()
        assert exc_info.value.status_code == 409


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
