from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, and_, or_
from app.models.reserva_model import Reserva, Paquete, PaqueteHotel, Pago, MetodoPago, HistorialReserva, ReservaHabitacion, ReservaServicio
from app.models.hotel_model import Habitacion, Hotel
from app.core.exceptions import (
    ReservaDependencyError, PaqueteDependencyError, NotFoundError,
    HabitacionNoDisponibleError, HabitacionNoEncontradaError, PaqueteNoEncontradoError,
)


class PaqueteRepository:

    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 10, incluir_inactivos: bool = False):
        # El sitio público solo debe ver paquetes activos (comportamiento
        # original, sin cambios) — incluir_inactivos=True es un opt-in nuevo
        # para el panel de admin, que sí necesita ver/gestionar los paquetes
        # desactivados (delete_paquete solo los desactiva, nunca los borra).
        query = db.query(Paquete)
        if not incluir_inactivos:
            query = query.filter(Paquete.activo == True)
        return query.order_by(Paquete.id_paquete).offset(skip).limit(limit).all()
    
    @staticmethod
    def get_by_id(db: Session, paquete_id: int):
        return db.query(Paquete).filter(Paquete.id_paquete == paquete_id).first()
    
    @staticmethod
    def _sync_hoteles(db: Session, paquete_id: int, hoteles_data: list):
        """Sincroniza paquete_hotel con la lista real recibida — antes esta
        tabla (ya existía en el modelo, la usa GET /paquetes/{id}/detalle)
        no tenía NINGÚN punto de escritura: un paquete nuevo creado desde el
        admin quedaba siempre sin hotel asociado, y nada impedía mezclar un
        paquete de una ciudad con un hotel de otra en Crear Reserva porque
        eran conceptos completamente desconectados. Valida que cada
        id_hotel exista de verdad antes de vincularlo (nunca confiar en el
        ID que manda el frontend sin verificar)."""
        if not hoteles_data:
            db.query(PaqueteHotel).filter(PaqueteHotel.id_paquete == paquete_id).delete()
            return

        ids_pedidos = [h["id_hotel"] for h in hoteles_data]
        hoteles_reales = set(
            row[0] for row in db.query(Hotel.id_hotel).filter(Hotel.id_hotel.in_(ids_pedidos)).all()
        )
        faltantes = set(ids_pedidos) - hoteles_reales
        if faltantes:
            raise NotFoundError(f"Hotel(es) no encontrado(s): {sorted(faltantes)}")

        existentes = {
            ph.id_hotel: ph
            for ph in db.query(PaqueteHotel).filter(PaqueteHotel.id_paquete == paquete_id).all()
        }
        ids_nuevos = set(ids_pedidos)
        for id_hotel, ph in existentes.items():
            if id_hotel not in ids_nuevos:
                db.delete(ph)

        for h in hoteles_data:
            id_hotel = h["id_hotel"]
            noches = h.get("noches_incluidas")
            if id_hotel in existentes:
                existentes[id_hotel].noches_incluidas = noches
            else:
                db.add(PaqueteHotel(id_paquete=paquete_id, id_hotel=id_hotel, noches_incluidas=noches))

    @staticmethod
    def create(db: Session, paquete_data: dict):
        # PaqueteCreate.dict() (sin exclude_unset) siempre trae la llave
        # "hoteles", así que se saca del dict antes de construir Paquete()
        # (no es una columna real del modelo) y se sincroniza aparte una vez
        # que el paquete ya tiene id_paquete.
        hoteles_data = paquete_data.pop("hoteles", None) or []
        paquete = Paquete(**paquete_data)
        db.add(paquete)
        db.flush()
        PaqueteRepository._sync_hoteles(db, paquete.id_paquete, hoteles_data)
        db.commit()
        db.refresh(paquete)
        return paquete
    
    @staticmethod
    def update(db: Session, paquete_id: int, paquete_data: dict):
        paquete = db.query(Paquete).filter(Paquete.id_paquete == paquete_id).first()
        if paquete:
            # exclude_unset=True: "hoteles" solo aparece en el dict si el
            # admin realmente lo mandó (ver update_paquete en
            # reserva_route.py) — si no vino, no se tocan los hoteles ya
            # vinculados, igual que "reactivar" solo manda {activo: true}
            # sin tocar el resto de campos.
            tiene_hoteles = "hoteles" in paquete_data
            hoteles_data = paquete_data.pop("hoteles", None) or []
            for key, value in paquete_data.items():
                if value is not None:
                    setattr(paquete, key, value)
            if tiene_hoteles:
                PaqueteRepository._sync_hoteles(db, paquete_id, hoteles_data)
            db.commit()
            db.refresh(paquete)
        return paquete
    
    @staticmethod
    def delete(db: Session, paquete_id: int):
        paquete = db.query(Paquete).filter(Paquete.id_paquete == paquete_id).first()
        if not paquete:
            raise NotFoundError(f"Paquete con ID {paquete_id} no encontrado")
        
        # Verificar si hay reservas usando este paquete
        reservas_count = db.query(func.count(Reserva.id_reserva)).filter(
            Reserva.id_paquete == paquete_id
        ).scalar() or 0
        
        if reservas_count > 0:
            raise PaqueteDependencyError(paquete_id, reservas_count)
        
        paquete.activo = False
        db.commit()
        db.refresh(paquete)
        return paquete


class ReservaRepository:
    
    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 10):
        # joinedload evita N+1 al resolver Reserva.precio_total / .nombre_paquete
        # / .destino / .hotel_nombre / .fecha_ultima_actualizacion (propiedades
        # usadas por ReservaResponse) para cada reserva de la lista del admin
        # — mismo criterio ya usado en get_by_cliente.
        return (
            db.query(Reserva)
            .options(
                joinedload(Reserva.paquete).joinedload(Paquete.paquete_hotel).joinedload(PaqueteHotel.hotel),
                joinedload(Reserva.reserva_habitaciones).joinedload(ReservaHabitacion.habitacion).joinedload(Habitacion.hotel),
                joinedload(Reserva.reserva_servicios),
                joinedload(Reserva.historial_reservas),
            )
            .offset(skip)
            .limit(limit)
            .all()
        )
    
    @staticmethod
    def get_by_id(db: Session, reserva_id: int):
        return db.query(Reserva).filter(Reserva.id_reserva == reserva_id).first()
    
    @staticmethod
    def get_by_cliente(db: Session, cliente_id: int, skip: int = 0, limit: int = 10):
        # joinedload evita N+1 al resolver Reserva.nombre_paquete / Reserva.destino
        # / Reserva.hotel_nombre (propiedades usadas por ReservaResponse) para
        # cada reserva del historial — incluye reserva_habitaciones porque una
        # reserva puede no tener paquete (reserva directa de habitación).
        return (
            db.query(Reserva)
            .options(
                joinedload(Reserva.paquete).joinedload(Paquete.paquete_hotel).joinedload(PaqueteHotel.hotel),
                joinedload(Reserva.reserva_habitaciones).joinedload(ReservaHabitacion.habitacion).joinedload(Habitacion.hotel),
            )
            .filter(Reserva.id_cliente == cliente_id)
            .offset(skip)
            .limit(limit)
            .all()
        )
    
    @staticmethod
    def get_by_estado(db: Session, estado: str, skip: int = 0, limit: int = 10):
        return db.query(Reserva).filter(Reserva.estado == estado).offset(skip).limit(limit).all()

    @staticmethod
    def _verificar_disponibilidad(db: Session, id_habitacion: int, fecha_checkin, fecha_checkout):
        """
        Revisa que la habitación exista, esté operativa, y que no tenga
        otra reserva activa que se cruce con el rango de fechas solicitado.
        """
        habitacion = db.query(Habitacion).filter(Habitacion.id_habitacion == id_habitacion).first()
        if not habitacion:
            raise HabitacionNoEncontradaError(id_habitacion)

        if habitacion.estado == "mantenimiento":
            raise HabitacionNoDisponibleError(id_habitacion, fecha_checkin, fecha_checkout)

        # Cruce de fechas: dos rangos se solapan si (inicio1 < fin2) y (inicio2 < fin1)
        cruce = (
            db.query(ReservaHabitacion)
            .join(Reserva, Reserva.id_reserva == ReservaHabitacion.id_reserva)
            .filter(
                ReservaHabitacion.id_habitacion == id_habitacion,
                Reserva.estado.in_(["pendiente", "confirmada"]),  # reservas activas
                and_(
                    ReservaHabitacion.fecha_checkin < fecha_checkout,
                    ReservaHabitacion.fecha_checkout > fecha_checkin,
                ),
            )
            .first()
        )
        if cruce:
            raise HabitacionNoDisponibleError(id_habitacion, fecha_checkin, fecha_checkout)

        return habitacion

    @staticmethod
    def create(db: Session, reserva_data: dict):
        """
        Crea una reserva. Si viene con `habitaciones`, valida disponibilidad real
        de cada una y guarda el precio real de la BD (nunca el que mande el frontend).
        """
        habitaciones_solicitadas = reserva_data.pop("habitaciones", None) or []

        # Si mandan id_paquete, verificar que exista de verdad
        id_paquete = reserva_data.get("id_paquete")
        if id_paquete is not None:
            paquete = db.query(Paquete).filter(Paquete.id_paquete == id_paquete).first()
            if not paquete:
                raise PaqueteNoEncontradoError(id_paquete)

        # Validar TODAS las habitaciones antes de crear nada (evita reservas a medias)
        habitaciones_validadas = []
        for h in habitaciones_solicitadas:
            habitacion = ReservaRepository._verificar_disponibilidad(
                db, h["id_habitacion"], h["fecha_checkin"], h["fecha_checkout"]
            )
            habitaciones_validadas.append((h, habitacion))

        reserva = Reserva(**reserva_data, estado="pendiente")
        db.add(reserva)
        db.flush()  # asigna id_reserva sin cerrar la transacción

        for h, habitacion in habitaciones_validadas:
            # BUG real corregido: antes guardaba precio_acordado=precio_noche
            # (tarifa de UNA sola noche) sin importar cuántas noches durara la
            # estadía. Reserva.precio_total (ver reserva_model.py) suma
            # precio_acordado tal cual, y pagar_reserva (reserva_route.py)
            # cobra ese total tal cual — así que una reserva de varias noches
            # se cobraba como si fuera de una sola, mientras el checkout
            # público (Checkout.tsx) sí calculaba y mostraba al cliente el
            # total real (precio_noche * noches). Se corrige acá, en el único
            # lugar donde se fija el precio real (nunca el que mande el
            # frontend), multiplicando por las noches reales de la reserva.
            noches = (h["fecha_checkout"] - h["fecha_checkin"]).days or 1
            reserva_habitacion = ReservaHabitacion(
                id_reserva=reserva.id_reserva,
                id_habitacion=habitacion.id_habitacion,
                fecha_checkin=h["fecha_checkin"],
                fecha_checkout=h["fecha_checkout"],
                precio_acordado=habitacion.precio_noche * noches,  # precio real de la BD × noches, no el del frontend
            )
            db.add(reserva_habitacion)

        db.commit()
        db.refresh(reserva)
        return reserva
    
    @staticmethod
    def update(db: Session, reserva_id: int, reserva_data: dict):
        reserva = db.query(Reserva).filter(Reserva.id_reserva == reserva_id).first()
        if reserva:
            for key, value in reserva_data.items():
                if value is not None:
                    setattr(reserva, key, value)
            db.commit()
            db.refresh(reserva)
        return reserva
    
    @staticmethod
    def delete(db: Session, reserva_id: int):
        reserva = db.query(Reserva).filter(Reserva.id_reserva == reserva_id).first()
        if not reserva:
            raise NotFoundError(f"Reserva con ID {reserva_id} no encontrada")
        
        # Verificar si tiene pagos
        pagos_count = db.query(func.count(Pago.id_pago)).filter(
            Pago.id_reserva == reserva_id
        ).scalar() or 0
        
        # Verificar si tiene habitaciones asignadas
        habitaciones_count = db.query(func.count(ReservaHabitacion.id_reserva)).filter(
            ReservaHabitacion.id_reserva == reserva_id
        ).scalar() or 0
        
        # Verificar si tiene servicios asignados
        servicios_count = db.query(func.count(ReservaServicio.id_reserva)).filter(
            ReservaServicio.id_reserva == reserva_id
        ).scalar() or 0
        
        if pagos_count > 0 or habitaciones_count > 0 or servicios_count > 0:
            raise ReservaDependencyError(reserva_id, pagos_count, habitaciones_count, servicios_count)
        
        db.delete(reserva)
        db.commit()
        return reserva


class PagoRepository:
    
    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 10):
        # BUG del mismo patrón encontrado en todos los demás módulos: sin
        # order_by, Postgres no garantiza ningún orden estable, así que una
        # vez que hay más pagos que el `limit`, cuáles quedan afuera es
        # arbitrario e inestable entre requests — afecta directamente qué
        # pago "más representativo" ve el admin en ModuleReservas.tsx.
        return db.query(Pago).order_by(Pago.fecha_pago.desc()).offset(skip).limit(limit).all()
    
    @staticmethod
    def get_by_id(db: Session, pago_id: int):
        return db.query(Pago).filter(Pago.id_pago == pago_id).first()
    
    @staticmethod
    def get_by_reserva(db: Session, reserva_id: int):
        return db.query(Pago).filter(Pago.id_reserva == reserva_id).all()
    
    @staticmethod
    def get_by_estado(db: Session, estado: str, skip: int = 0, limit: int = 10):
        return db.query(Pago).filter(Pago.estado == estado).order_by(Pago.fecha_pago.desc()).offset(skip).limit(limit).all()
    
    @staticmethod
    def create(db: Session, pago_data: dict):
        pago = Pago(**pago_data, estado="pendiente")
        db.add(pago)
        db.commit()
        db.refresh(pago)
        return pago
    
    @staticmethod
    def update(db: Session, pago_id: int, pago_data: dict):
        pago = db.query(Pago).filter(Pago.id_pago == pago_id).first()
        if pago:
            for key, value in pago_data.items():
                if value is not None:
                    setattr(pago, key, value)
            db.commit()
            db.refresh(pago)
        return pago
    
    @staticmethod
    def delete(db: Session, pago_id: int):
        pago = db.query(Pago).filter(Pago.id_pago == pago_id).first()
        if pago:
            db.delete(pago)
            db.commit()
        return pago


class MetodoPagoRepository:
    
    @staticmethod
    def get_all(db: Session):
        return db.query(MetodoPago).all()
    
    @staticmethod
    def get_by_id(db: Session, metodo_id: int):
        return db.query(MetodoPago).filter(MetodoPago.id_metodo == metodo_id).first()
    
    @staticmethod
    def create(db: Session, metodo_data: dict):
        metodo = MetodoPago(**metodo_data)
        db.add(metodo)
        db.commit()
        db.refresh(metodo)
        return metodo