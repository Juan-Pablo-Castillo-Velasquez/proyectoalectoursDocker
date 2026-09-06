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
    # Etiqueta de temporada opcional (coincide con Tema.clave, ej.
    # "halloween") -- None significa "vigente todo el año", sin importar
    # qué tema de color esté activo. Permite que un banner (ej. arte de
    # Halloween) solo aparezca en el carrusel mientras esa temporada esté
    # realmente activa (ver BannerRepository.get_activos), en vez de
    # quedar visible todo el año o depender de que alguien lo
    # active/desactive a mano cada temporada.
    temporada = Column(String(40), nullable=True)
    # "banner" (carrusel/splash de siempre, con titulo/descripcion/boton) o
    # "folleto" (pieza tipo afiche: solo imagen + link, con el texto ya
    # dibujado en la imagen -- es el anuncio a pantalla completa que ve
    # cualquiera al entrar al sitio cuando hay uno activo, con prioridad
    # sobre el banner clasico; ver WelcomeSplash.tsx en el frontend).
    # Nunca None: server_default en la migracion deja "banner" en las
    # filas que ya existian.
    tipo = Column(String(20), nullable=False, default="banner")
    orden = Column(Integer, nullable=False, default=0)
    activo = Column(Boolean, nullable=False, default=True)
    fecha_creacion = Column(TIMESTAMP, server_default=func.now())
