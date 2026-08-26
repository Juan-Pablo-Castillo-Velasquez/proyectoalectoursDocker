from sqlalchemy.orm import Session, joinedload

from app.models.favorito_model import Favorito


class FavoritoRepository:

    @staticmethod
    def get_by_cliente(db: Session, id_cliente: int):
        return (
            db.query(Favorito)
            .options(joinedload(Favorito.hotel))
            .filter(Favorito.id_cliente == id_cliente)
            .order_by(Favorito.fecha_creacion.desc())
            .all()
        )

    @staticmethod
    def get_ids_by_cliente(db: Session, id_cliente: int):
        rows = db.query(Favorito.id_hotel).filter(Favorito.id_cliente == id_cliente).all()
        return [r[0] for r in rows]

    @staticmethod
    def get_by_cliente_and_hotel(db: Session, id_cliente: int, id_hotel: int):
        return (
            db.query(Favorito)
            .filter(Favorito.id_cliente == id_cliente, Favorito.id_hotel == id_hotel)
            .first()
        )

    @staticmethod
    def create(db: Session, id_cliente: int, id_hotel: int) -> Favorito:
        favorito = Favorito(id_cliente=id_cliente, id_hotel=id_hotel)
        db.add(favorito)
        db.commit()
        db.refresh(favorito)
        return favorito

    @staticmethod
    def delete(db: Session, id_cliente: int, id_hotel: int) -> bool:
        favorito = (
            db.query(Favorito)
            .filter(Favorito.id_cliente == id_cliente, Favorito.id_hotel == id_hotel)
            .first()
        )
        if not favorito:
            return False
        db.delete(favorito)
        db.commit()
        return True
