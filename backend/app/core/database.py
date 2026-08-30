from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.core.config import settings

engine = create_engine(settings.DATABASE_URL, echo=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()


# Importar todos los modelos DESPUÉS de crear Base
# Esto es necesario para que SQLAlchemy registre todas las tablas
from app.models import *  # noqa: F403, E402 -- necesario para registrar todas las tablas en Base.metadata
