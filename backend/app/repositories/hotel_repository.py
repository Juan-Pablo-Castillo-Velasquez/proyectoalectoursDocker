from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.hotel_model import Hotel, Habitacion, Caracteristica, HotelCaracteristica
from app.core.exceptions import HotelDependencyError, NotFoundError


class HotelRepository:

    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 10):
        return db.query(Hotel).offset(skip).limit(limit).all()

    @staticmethod
    def get_destacados(db: Session, limit: int = 3):
        """Hoteles mejor calificados con su precio de habitación más bajo."""
        resultados = (
            db.query(
                Hotel.id_hotel,
                Hotel.nombre_hotel,
                Hotel.ciudad,
                Hotel.pais,
                Hotel.calificacion,
                func.min(Habitacion.precio_noche).label("precio_desde"),
            )
            .join(Habitacion, Habitacion.id_hotel == Hotel.id_hotel)
            .group_by(Hotel.id_hotel, Hotel.nombre_hotel, Hotel.ciudad, Hotel.pais, Hotel.calificacion)
            .order_by(Hotel.calificacion.desc(), func.min(Habitacion.precio_noche).asc())
            .limit(limit)
            .all()
        )
        return resultados

    @staticmethod
    def get_by_id(db: Session, hotel_id: int):
        return db.query(Hotel).filter(Hotel.id_hotel == hotel_id).first()

    @staticmethod
    def create(db: Session, hotel_data: dict):
        hotel = Hotel(**hotel_data)
        db.add(hotel)
        db.commit()
        db.refresh(hotel)
        return hotel

    @staticmethod
    def update(db: Session, hotel_id: int, hotel_data: dict):
        hotel = db.query(Hotel).filter(Hotel.id_hotel == hotel_id).first()
        if hotel:
            for key, value in hotel_data.items():
                if value is not None:
                    setattr(hotel, key, value)
            db.commit()
            db.refresh(hotel)
        return hotel

    @staticmethod
    def delete(db: Session, hotel_id: int):
        hotel = db.query(Hotel).filter(Hotel.id_hotel == hotel_id).first()
        if not hotel:
            raise NotFoundError(f"Hotel con ID {hotel_id} no encontrado")

        # Verificar dependencias
        habitaciones_count = db.query(func.count(Habitacion.id_habitacion)).filter(
            Habitacion.id_hotel == hotel_id
        ).scalar() or 0

        caracteristicas_count = db.query(func.count(HotelCaracteristica.id_hotel)).filter(
            HotelCaracteristica.id_hotel == hotel_id
        ).scalar() or 0

        if habitaciones_count > 0 or caracteristicas_count > 0:
            raise HotelDependencyError(hotel_id, habitaciones_count, caracteristicas_count)

        db.delete(hotel)
        db.commit()
        return hotel


class HabitacionRepository:

    @staticmethod
    def get_all(db: Session, hotel_id: int = None, skip: int = 0, limit: int = 10):
        query = db.query(Habitacion)
        if hotel_id:
            query = query.filter(Habitacion.id_hotel == hotel_id)
        return query.offset(skip).limit(limit).all()

    @staticmethod
    def get_by_id(db: Session, habitacion_id: int):
        return db.query(Habitacion).filter(Habitacion.id_habitacion == habitacion_id).first()

    @staticmethod
    def get_by_hotel_and_number(db: Session, hotel_id: int, numero: str):
        return db.query(Habitacion).filter(
            Habitacion.id_hotel == hotel_id,
            Habitacion.numero_habitacion == numero
        ).first()

    @staticmethod
    def create(db: Session, habitacion_data: dict):
        habitacion = Habitacion(**habitacion_data)
        db.add(habitacion)
        db.commit()
        db.refresh(habitacion)
        return habitacion

    @staticmethod
    def update(db: Session, habitacion_id: int, habitacion_data: dict):
        habitacion = db.query(Habitacion).filter(Habitacion.id_habitacion == habitacion_id).first()
        if habitacion:
            for key, value in habitacion_data.items():
                if value is not None:
                    setattr(habitacion, key, value)
            db.commit()
            db.refresh(habitacion)
        return habitacion

    @staticmethod
    def delete(db: Session, habitacion_id: int):
        habitacion = db.query(Habitacion).filter(Habitacion.id_habitacion == habitacion_id).first()
        if habitacion:
            db.delete(habitacion)
            db.commit()
        return habitacion

    @staticmethod
    def get_disponibles(db: Session, hotel_id: int, skip: int = 0, limit: int = 10):
        return db.query(Habitacion).filter(
            Habitacion.id_hotel == hotel_id,
            Habitacion.estado == "disponible"
        ).offset(skip).limit(limit).all()


class CaracteristicaRepository:

    @staticmethod
    def get_all(db: Session):
        return db.query(Caracteristica).all()

    @staticmethod
    def get_by_id(db: Session, caracteristica_id: int):
        return db.query(Caracteristica).filter(
            Caracteristica.id_caracteristica == caracteristica_id
        ).first()

    @staticmethod
    def create(db: Session, caracteristica_data: dict):
        caracteristica = Caracteristica(**caracteristica_data)
        db.add(caracteristica)
        db.commit()
        db.refresh(caracteristica)
        return caracteristica

    @staticmethod
    def delete(db: Session, caracteristica_id: int):
        caracteristica = db.query(Caracteristica).filter(
            Caracteristica.id_caracteristica == caracteristica_id
        ).first()
        if caracteristica:
            db.delete(caracteristica)
            db.commit()
        return caracteristica


class HotelCaracteristicaRepository:

    @staticmethod
    def get_by_hotel(db: Session, hotel_id: int):
        return db.query(HotelCaracteristica).filter(
            HotelCaracteristica.id_hotel == hotel_id
        ).all()

    @staticmethod
    def add_caracteristica(db: Session, hotel_id: int, caracteristica_id: int, disponible: bool = True):
        hc = HotelCaracteristica(
            id_hotel=hotel_id,
            id_caracteristica=caracteristica_id,
            disponible=disponible
        )
        db.add(hc)
        db.commit()
        db.refresh(hc)
        return hc

    @staticmethod
    def remove_caracteristica(db: Session, hotel_id: int, caracteristica_id: int):
        hc = db.query(HotelCaracteristica).filter(
            HotelCaracteristica.id_hotel == hotel_id,
            HotelCaracteristica.id_caracteristica == caracteristica_id
        ).first()
        if hc:
            db.delete(hc)
            db.commit()
        return hc