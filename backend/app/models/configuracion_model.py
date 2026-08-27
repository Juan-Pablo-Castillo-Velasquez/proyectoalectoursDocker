from sqlalchemy import Column, Integer, String, Text, TIMESTAMP, func
from app.core.database import Base


class ConfiguracionSistema(Base):
    """Parámetros del sistema editables desde el admin (clave/valor). No
    todos los valores guardados acá controlan una funcionalidad todavía —
    cada uno se conecta a comportamiento real a medida que esa parte del
    sitio se construye; el módulo de Configuración solo es el lugar donde
    se guardan de forma centralizada en vez de quedar hardcodeados."""
    __tablename__ = "configuracion_sistema"

    id_config = Column(Integer, primary_key=True, index=True)
    clave = Column(String(100), nullable=False, unique=True)
    valor = Column(Text, nullable=True)
    descripcion = Column(String(255), nullable=True)
    actualizado_en = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
