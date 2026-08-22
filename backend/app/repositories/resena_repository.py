from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func

from app.models.resena_model import Resena
from app.models.reserva_model import Reserva, PaqueteHotel


class ResenaRepository:

    @staticmethod
    def get_hotel_id_from_reserva(db: Session, id_reserva: int):
        """El hotel de una reserva se deriva del paquete asociado (paquete_hotel)."""
        reserva = db.query(Reserva).filter(Reserva.id_reserva == id_reserva).first()
        if not reserva or not reserva.id_paquete:
            return None
        ph = db.query(PaqueteHotel).filter(PaqueteHotel.id_paquete == reserva.id_paquete).first()
        return ph.id_hotel if ph else None

    @staticmethod
    def get_by_reserva(db: Session, id_reserva: int):
        return db.query(Resena).filter(Resena.id_reserva == id_reserva).first()

    @staticmethod
    def create(db: Session, id_reserva: int, id_cliente: int, id_hotel: int,
                calificacion: int, comentario: str, foto_url: str = None):
        resena = Resena(
            id_reserva=id_reserva,
            id_cliente=id_cliente,
            id_hotel=id_hotel,
            calificacion=calificacion,
            comentario=comentario,
            foto_url=foto_url,
        )
        db.add(resena)
        db.commit()
        db.refresh(resena)
        return resena

    @staticmethod
    def get_by_hotel(db: Session, id_hotel: int, skip: int = 0, limit: int = 20):
        return (
            db.query(Resena)
            .options(joinedload(Resena.cliente))
            .filter(Resena.id_hotel == id_hotel)
            .order_by(Resena.fecha_creacion.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    @staticmethod
    def get_promedio_hotel(db: Session, id_hotel: int):
        return (
            db.query(
                func.avg(Resena.calificacion).label("promedio"),
                func.count(Resena.id_resena).label("total"),
            )
            .filter(Resena.id_hotel == id_hotel)
            .first()
        )