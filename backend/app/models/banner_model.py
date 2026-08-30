from sqlalchemy import TIMESTAMP, Boolean, Column, Date, Integer, String
from sqlalchemy.sql import func

from app.core.database import Base


class Banner(Base):
    """Banners publicitarios administrables (sección 7 del plan de mejora).

    Antes de esto, /api/promociones/* (promociones_route.py) NO era una
    tabla de banners: derivaba datos reales de `hoteles` y rellenaba
    imagen/"noches sugeridas" con arrays hardcodeados porque Hotel no tiene
    ningún campo de imagen. Esto es contenido genuinamente nuevo y
    editable desde el admin — carrusel del home / banner de oferta
    destacada — sin depender de ninguna tabla existente ni chocar con esa
    ruta (por eso vive en /api/banners, prefijo distinto)."""

    __tablename__ = "banners_publicitarios"

    id_banner = Column(Integer, primary_key=True, index=True)
    titulo = Column(String(150), nullable=False)
    descripcion_corta = Column(String(300), nullable=True)
    # Ruta pública bajo /uploads/banners/... — mismo patrón que
    # Usuario.foto_perfil (ver usuario_route.py::subir_foto_perfil).
    imagen_url = Column(String(255), nullable=False)
    texto_boton = Column(String(50), nullable=True)
    link_destino = Column(String(255), nullable=True)
    # None en cualquiera de los dos extremos significa "sin límite" en ese
    # lado (ej. fecha_fin=None = vigente indefinidamente hacia adelante).
    fecha_inicio = Column(Date, nullable=True)
    fecha_fin = Column(Date, nullable=True)
    orden = Column(Integer, nullable=False, default=0)
    activo = Column(Boolean, nullable=False, default=True)
    fecha_creacion = Column(TIMESTAMP, server_default=func.now())
