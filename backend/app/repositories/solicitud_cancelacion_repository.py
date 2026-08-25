# Guardar como: backend/app/repositories/solicitud_cancelacion_repository.py

from sqlalchemy.orm import Session
from app.models.reserva_model import SolicitudCancelacion, Reserva


class SolicitudCancelacionRepository:

    @staticmethod
    def get_by_id(db: Session, id_solicitud: int):
        return db.query(SolicitudCancelacion).filter(
            SolicitudCancelacion.id_solicitud == id_solicitud
        ).first()

    @staticmethod
    def get_pendiente_by_reserva(db: Session, id_reserva: int):
        """Solicitud pendiente actual de esa reserva, si existe."""
        return db.query(SolicitudCancelacion).filter(
            SolicitudCancelacion.id_reserva == id_reserva,
            SolicitudCancelacion.estado == "pendiente",
        ).first()

    @staticmethod
    def get_by_cliente(db: Session, id_cliente: int, skip: int = 0, limit: int = 10):
        return (
            db.query(SolicitudCancelacion)
            .filter(SolicitudCancelacion.id_cliente == id_cliente)
            .order_by(SolicitudCancelacion.fecha_solicitud.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    @staticmethod
    def get_all_pendientes(db: Session, skip: int = 0, limit: int = 10):
        """Para el futuro panel de admin: cola de solicitudes por resolver."""
        return (
            db.query(SolicitudCancelacion)
            .filter(SolicitudCancelacion.estado == "pendiente")
            .order_by(SolicitudCancelacion.fecha_solicitud.asc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    @staticmethod
    def create(db: Session, id_reserva: int, id_cliente: int, motivo: str, motivo_detalle: str | None):
        solicitud = SolicitudCancelacion(
            id_reserva=id_reserva,
            id_cliente=id_cliente,
            motivo=motivo,
            motivo_detalle=motivo_detalle,
            estado="pendiente",
        )
        db.add(solicitud)
        db.commit()
        db.refresh(solicitud)
        return solicitud