"""
Fixtures compartidas por toda la suite de tests del backend.

Motor SQLite en memoria + fixture `db` por test, extraído de la
duplicación exacta que tenían test_delete_exceptions.py,
test_destino_servicio_delete.py, test_reservas_pagos.py y
test_verificacion_email.py antes de esta reorganización -- cada uno
definía su propio engine, su propio parche ARRAY->JSON y su propia
fixture `db`, palabra por palabra iguales. Con esto centralizado acá,
cada archivo de test solo necesita importar los modelos/repositorios/
rutas que usa de verdad en sus casos, no copiar 15 líneas de setup.

`from app.models import *` importa (y por lo tanto registra en el mapper
de SQLAlchemy) TODOS los modelos de la app antes de armar las tablas --
sin esto, configurar cualquier mapper revienta con "failed to locate a
name" apenas se toca una relationship() que apunte a una clase que ningún
test individual haya importado (mismo import que usa
app/core/database.py para construir su propio Base.metadata).
"""

import pytest
import sqlalchemy as sa
from sqlalchemy import ARRAY, create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.models import *  # noqa: F401, F403

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# SQLite no soporta ARRAY (usado en preferencias_cliente.intereses --
# ARRAY(String) genérico de sqlalchemy, no el de postgresql.dialects). Se
# cambia a JSON solo para este motor de pruebas en memoria.
for table in Base.metadata.tables.values():
    for column in table.columns:
        if isinstance(column.type, ARRAY):
            column.type = sa.JSON()

Base.metadata.create_all(bind=engine)


@pytest.fixture
def db():
    """Base de datos SQLite en memoria fresca para cada test."""
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    yield session
    session.close()
    Base.metadata.drop_all(bind=engine)
