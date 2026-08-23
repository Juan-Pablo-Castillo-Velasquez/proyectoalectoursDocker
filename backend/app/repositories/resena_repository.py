from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func

from app.models.resena_model import Resena
from app.models.reserva_model import Reserva, PaqueteHotel, ReservaHabitacion
from app.models.hotel_model import Habitacion


class ResenaRepository:

    @staticmethod
    def get_hotel_id_from_reserva(db: Session, id_reserva: int):
        """
        El hotel de una reserva se deriva:
        1) del paquete asociado (paquete_hotel), si la reserva tiene id_paquete; o
        2) si no hay paquete (reserva directa de habitación), de la habitación
           reservada vía reserva_habitaciones -> habitaciones -> id_hotel.
        """
        reserva = db.query(Reserva).filter(Reserva.id_reserva == id_reserva).first()
        if not reserva:
            return None

        if reserva.id_paquete:
            ph = db.query(PaqueteHotel).filter(PaqueteHotel.id_paquete == reserva.id_paquete).first()
            if ph:
                return ph.id_hotel

        # Fallback: reserva directa de habitación, sin paquete
        rh = (
            db.query(ReservaHabitacion)
            .join(Habitacion, Habitacion.id_habitacion == ReservaHabitacion.id_habitacion)
            .filter(ReservaHabitacion.id_reserva == id_reserva)
            .first()
        )
        return rh.habitacion.id_hotel if rh else None

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