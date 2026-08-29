"""
Tests de las excepciones de borrado por FK para Destino y Servicio — Fase 1
del plan de mejora ("manejo de errores consistente").

Antes de este fix, `delete_destino` y `delete_servicio` (backend/app/routes/
destino_route.py y servicio_route.py) hacían un `db.delete()` directo sin
validar dependencias: borrar un destino con servicios asociados, o un
servicio usado en un paquete/reserva, o bien lanzaba un IntegrityError sin
manejar (500 genérico) o —peor— cascadeaba en silencio (PaqueteServicio y
ServicioProveedor son ondelete="CASCADE") dejando paquetes rotos sin ningún
aviso, el mismo problema ya corregido antes para hoteles
(HotelDependencyError). Las clases DestinoDependencyError y
ServicioDependencyError ya existían en app/core/exceptions.py pero no se
usaban en ningún lado — este archivo prueba que ahora sí se usan.

Mismo patrón que test_delete_exceptions.py: SQLite en memoria, llamando
directo a la función de la ruta (no hay capa de repositorio para
Destino/Servicio) con un admin_id ficticio, sin pasar por FastAPI ni HTTP.
"""
import pytest
import sqlalchemy as sa
from sqlalchemy import create_engine, ARRAY
from sqlalchemy.orm import sessionmaker
from fastapi import HTTPException

from app.core.database import Base
from app.models.servicio_model import Destino, Servicio, Proveedor, ServicioProveedor
from app.models.reserva_model import Paquete, PaqueteServicio
# Mismo motivo que test_delete_exceptions.py: registrar todos los modelos
# con relationship() antes de la primera query / create_all.
from app.models.cliente_model import Cliente
from app.models.hotel_model import Hotel
from app.models.user_model import Usuario
from app.models.resena_model import Resena
from app.models.favorito_model import Favorito
from app.models.metodo_pago_guardado_model import MetodoPagoGuardado
from app.models.configuracion_model import ConfiguracionSistema
from app.models.notificacion_model import Notificacion
from app.models.empresa_model import SolicitudCorporativa

from app.routes.destino_route import delete_destino
from app.routes.servicio_route import delete_servicio


SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

for table in Base.metadata.tables.values():
    for column in table.columns:
        if isinstance(column.type, ARRAY):
            column.type = sa.JSON()

Base.metadata.create_all(bind=engine)


@pytest.fixture
def db():
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    yield session
    session.close()
    Base.metadata.drop_all(bind=engine)


def _crear_destino(db, nombre="Destino Test"):
    destino = Destino(nombre_destino=nombre, ciudad="Ciudad", pais="País")
    db.add(destino)
    db.commit()
    return destino


def _crear_servicio(db, id_destino=None, nombre="Servicio Test"):
    servicio = Servicio(
        nombre_servicio=nombre,
        id_destino=id_destino,
        precio_base=50000,
        capacidad_maxima=10,
    )
    db.add(servicio)
    db.commit()
    return servicio


class TestDestinoDeletionExceptions:

    def test_delete_destino_sin_dependencias(self, db):
        destino = _crear_destino(db)
        result = delete_destino(destino.id_destino, db=db, admin_id=1)
        assert result == {"message": "Destino eliminado exitosamente"}
        assert db.query(Destino).filter(Destino.id_destino == destino.id_destino).first() is None

    def test_delete_destino_inexistente(self, db):
        with pytest.raises(HTTPException) as exc_info:
            delete_destino(9999, db=db, admin_id=1)
        assert exc_info.value.status_code == 404

    def test_delete_destino_con_servicios_rechazado(self, db):
        destino = _crear_destino(db)
        _crear_servicio(db, id_destino=destino.id_destino)

        with pytest.raises(HTTPException) as exc_info:
            delete_destino(destino.id_destino, db=db, admin_id=1)

        assert exc_info.value.status_code == 409
        # El destino debe seguir existiendo — el borrado no debe haberse
        # aplicado parcialmente.
        assert db.query(Destino).filter(Destino.id_destino == destino.id_destino).first() is not None


class TestServicioDeletionExceptions:

    def test_delete_servicio_sin_dependencias(self, db):
        servicio = _crear_servicio(db)
        result = delete_servicio(servicio.id_servicio, db=db, admin_id=1)
        assert result == {"message": "Servicio eliminado exitosamente"}
        assert db.query(Servicio).filter(Servicio.id_servicio == servicio.id_servicio).first() is None

    def test_delete_servicio_inexistente(self, db):
        with pytest.raises(HTTPException) as exc_info:
            delete_servicio(9999, db=db, admin_id=1)
        assert exc_info.value.status_code == 404

    def test_delete_servicio_en_paquete_rechazado(self, db):
        """Antes: PaqueteServicio.id_servicio es ondelete=CASCADE, así que
        esto borraba el servicio y rompía el paquete en silencio."""
        servicio = _crear_servicio(db)
        paquete = Paquete(nombre_paquete="Paquete Test", precio_base=100000)
        db.add(paquete)
        db.commit()
        db.add(PaqueteServicio(id_paquete=paquete.id_paquete, id_servicio=servicio.id_servicio))
        db.commit()

        with pytest.raises(HTTPException) as exc_info:
            delete_servicio(servicio.id_servicio, db=db, admin_id=1)

        assert exc_info.value.status_code == 409
        assert db.query(Servicio).filter(Servicio.id_servicio == servicio.id_servicio).first() is not None
        # El vínculo con el paquete tampoco debe haberse tocado.
        assert db.query(PaqueteServicio).filter(
            PaqueteServicio.id_servicio == servicio.id_servicio
        ).first() is not None

    def test_delete_servicio_con_proveedor_rechazado(self, db):
        servicio = _crear_servicio(db)
        proveedor = Proveedor(nombre_proveedor="Proveedor Test")
        db.add(proveedor)
        db.commit()
        db.add(ServicioProveedor(id_servicio=servicio.id_servicio, id_proveedor=proveedor.id_proveedor))
        db.commit()

        with pytest.raises(HTTPException) as exc_info:
            delete_servicio(servicio.id_servicio, db=db, admin_id=1)

        assert exc_info.value.status_code == 409
