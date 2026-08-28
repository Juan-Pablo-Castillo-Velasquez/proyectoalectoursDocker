from sqlalchemy.orm import Session
from app.repositories.reserva_detail_repository import ReservaDetailRepository

class ReservaDetailService:

    @staticmethod
    def get_habitaciones(db: Session, reserva_id: int):
        return ReservaDetailRepository.get_habitaciones(db, reserva_id)

    @staticmethod
    def get_servicios(db: Session, reserva_id: int):
        return ReservaDetailRepository.get_servicios(db, reserva_id)

    @staticmethod
    def get_historial(db: Session, reserva_id: int):
        return ReservaDetailRepository.get_historial(db, reserva_id)

    @staticmethod
    def get_historial_reciente(db: Session, limit: int = 15):
        return ReservaDetailRepository.get_historial_reciente(db, limit)

    @staticmethod
    def add_nota(db: Session, reserva_id: int, id_empleado, comentario: str):
        return ReservaDetailRepository.add_nota(db, reserva_id, id_empleado, comentario)