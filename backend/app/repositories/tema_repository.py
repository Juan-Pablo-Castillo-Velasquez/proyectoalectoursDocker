import re
import unicodedata

from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError
from app.models.tema_model import Tema


class TemaEnUsoError(Exception):
    """El tema que se intenta borrar está activo o es el predeterminado."""


def _generar_clave(nombre: str) -> str:
    # Mismo criterio de slug simple usado en el resto del proyecto: sin
    # tildes, minúsculas, espacios/símbolos a guiones -- no depende de
    # ninguna librería externa nueva.
    sin_tildes = unicodedata.normalize("NFKD", nombre).encode("ascii", "ignore").decode("ascii")
    slug = re.sub(r"[^a-z0-9]+", "-", sin_tildes.lower()).strip("-")
    return slug or "tema"


class TemaRepository:
    @staticmethod
    def get_all(db: Session):
        return db.query(Tema).order_by(Tema.es_predeterminado.desc(), Tema.id_tema.asc()).all()

    @staticmethod
    def get_by_id(db: Session, id_tema: int):
        return db.query(Tema).filter(Tema.id_tema == id_tema).first()

    @staticmethod
    def get_activo(db: Session):
        """El tema vigente ahora mismo -- si por alguna razón ninguno
        quedó marcado activo (no debería pasar, pero nunca se asume),
        cae de vuelta al predeterminado para no dejar el sitio sin acento."""
        tema = db.query(Tema).filter(Tema.activo == True).first()  # noqa: E712
        if tema:
            return tema
        return db.query(Tema).filter(Tema.es_predeterminado == True).first()  # noqa: E712

    @staticmethod
    def _clave_disponible(db: Session, clave: str, excluir_id: int | None = None) -> str:
        base = clave
        sufijo = 2
        while True:
            query = db.query(Tema).filter(Tema.clave == clave)
            if excluir_id is not None:
                query = query.filter(Tema.id_tema != excluir_id)
            if not query.first():
                return clave
            clave = f"{base}-{sufijo}"
            sufijo += 1

    @staticmethod
    def create(db: Session, datos: dict):
        clave = TemaRepository._clave_disponible(db, _generar_clave(datos["nombre"]))
        tema = Tema(**datos, clave=clave, activo=False, es_predeterminado=False)
        db.add(tema)
        db.commit()
        db.refresh(tema)
        return tema

    @staticmethod
    def update(db: Session, id_tema: int, datos: dict):
        tema = db.query(Tema).filter(Tema.id_tema == id_tema).first()
        if not tema:
            raise NotFoundError(f"Tema con ID {id_tema} no encontrado")
        for key, value in datos.items():
            setattr(tema, key, value)
        db.commit()
        db.refresh(tema)
        return tema

    @staticmethod
    def activar(db: Session, id_tema: int):
        """Activa este tema y desactiva todos los demás -- solo uno puede
        estar activo a la vez (regla de negocio, no una constraint de BD:
        con el catálogo tan chico no vale la pena una tabla de una sola
        fila aparte para "configuración de tema activo")."""
        tema = db.query(Tema).filter(Tema.id_tema == id_tema).first()
        if not tema:
            raise NotFoundError(f"Tema con ID {id_tema} no encontrado")
        db.query(Tema).filter(Tema.id_tema != id_tema).update({"activo": False})
        tema.activo = True
        db.commit()
        db.refresh(tema)
        return tema

    @staticmethod
    def delete(db: Session, id_tema: int):
        tema = db.query(Tema).filter(Tema.id_tema == id_tema).first()
        if not tema:
            raise NotFoundError(f"Tema con ID {id_tema} no encontrado")
        if tema.es_predeterminado:
            raise TemaEnUsoError("El tema de marca predeterminado no se puede eliminar.")
        if tema.activo:
            raise TemaEnUsoError("No se puede eliminar el tema activo. Activa otro primero.")
        db.delete(tema)
        db.commit()
        return {"message": "Tema eliminado exitosamente"}
