from datetime import date

from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError
from app.models.banner_model import Banner
from app.repositories.tema_repository import TemaRepository


class BannerRepository:
    @staticmethod
    def get_all(db: Session):
        """Listado completo para el admin (ModuleBanners.tsx) — incluye
        inactivos y fuera de vigencia, a diferencia de get_activos."""
        return db.query(Banner).order_by(Banner.orden.asc(), Banner.id_banner.asc()).all()

    @staticmethod
    def get_activos(db: Session, tipo: str | None = None):
        """Los que de verdad debe ver un visitante del sitio ahora mismo:
        activos, dentro de su rango de vigencia (None en fecha_inicio o
        fecha_fin = sin límite en ese extremo), y si tienen `temporada`
        (ej. "halloween"), que coincida con el tema de color realmente
        activo ahora -- un banner de temporada nunca se cuela fuera de su
        temporada solo porque alguien lo dejó activo/vigente por fecha.

        `tipo` ("banner" | "folleto") es opcional: BannersPromocionales.tsx
        y WelcomeSplash.tsx siempre piden tipo="banner" (mismo carrusel de
        siempre, folletos nunca se mezclan ahí), FolletosGrid.tsx pide
        tipo="folleto" -- sin filtro, devuelve ambos tipos mezclados."""
        hoy = date.today()
        tema_activo = TemaRepository.get_activo(db)
        clave_activa = tema_activo.clave if tema_activo else None

        filtros = [
            Banner.activo == True,  # noqa: E712
            or_(Banner.fecha_inicio.is_(None), Banner.fecha_inicio <= hoy),
            or_(Banner.fecha_fin.is_(None), Banner.fecha_fin >= hoy),
        ]
        if clave_activa:
            filtros.append(or_(Banner.temporada.is_(None), Banner.temporada == clave_activa))
        else:
            # Caso extremo (no debería pasar, ver TemaRepository.get_activo):
            # sin ningún tema activo ni predeterminado, solo se muestran
            # los banners sin temporada asignada.
            filtros.append(Banner.temporada.is_(None))
        if tipo:
            filtros.append(Banner.tipo == tipo)

        return (
            db.query(Banner)
            .filter(*filtros)
            .order_by(Banner.orden.asc(), Banner.id_banner.asc())
            .all()
        )

    @staticmethod
    def get_by_id(db: Session, banner_id: int):
        return db.query(Banner).filter(Banner.id_banner == banner_id).first()

    @staticmethod
    def get_siguiente_orden(db: Session) -> int:
        """Nuevo banner va al final de la fila por defecto — nunca se
        inventa un `orden` a mano en el frontend."""
        ultimo = db.query(Banner).order_by(Banner.orden.desc()).first()
        return (ultimo.orden + 1) if ultimo else 0

    @staticmethod
    def create(db: Session, banner_data: dict):
        banner = Banner(**banner_data)
        db.add(banner)
        db.commit()
        db.refresh(banner)
        return banner

    @staticmethod
    def update(db: Session, banner_id: int, banner_data: dict):
        banner = db.query(Banner).filter(Banner.id_banner == banner_id).first()
        if not banner:
            raise NotFoundError(f"Banner con ID {banner_id} no encontrado")
        for key, value in banner_data.items():
            if value is not None:
                setattr(banner, key, value)
        db.commit()
        db.refresh(banner)
        return banner

    @staticmethod
    def set_activo(db: Session, banner_id: int, activo: bool):
        banner = db.query(Banner).filter(Banner.id_banner == banner_id).first()
        if not banner:
            raise NotFoundError(f"Banner con ID {banner_id} no encontrado")
        banner.activo = activo
        db.commit()
        db.refresh(banner)
        return banner

    @staticmethod
    def reorder(db: Session, items: list[dict]):
        """`items` = [{"id_banner": .., "orden": ..}, ...] — ya viene con el
        orden final completo desde el frontend (botones subir/bajar
        recalculan el arreglo completo antes de mandar), así que acá solo
        se aplica tal cual, sin inventar ninguna regla nueva de ordenamiento."""
        ids = [item["id_banner"] for item in items]
        banners = db.query(Banner).filter(Banner.id_banner.in_(ids)).all()
        banners_por_id = {b.id_banner: b for b in banners}
        for item in items:
            banner = banners_por_id.get(item["id_banner"])
            if banner:
                banner.orden = item["orden"]
        db.commit()
        return BannerRepository.get_all(db)

    @staticmethod
    def delete(db: Session, banner_id: int):
        banner = db.query(Banner).filter(Banner.id_banner == banner_id).first()
        if not banner:
            raise NotFoundError(f"Banner con ID {banner_id} no encontrado")
        db.delete(banner)
        db.commit()
        return {"message": "Banner eliminado exitosamente"}
