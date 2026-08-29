"""
Tests de la lógica de negocio real de reservas y pagos — Fase 1 del plan
de mejora ("Confiabilidad de datos").

Antes de esta suite, la única cobertura automatizada de todo el proyecto
eran las excepciones de borrado por FK (test_delete_exceptions.py). Esta
suite cubre en cambio los tres puntos donde un bug real ya causó (o podía
causar) un cobro incorrecto: el cálculo de precio por múltiples noches
(bug real, corregido esta sesión en reserva_repository.py), el chequeo de
disponibilidad/cruce de fechas de una habitación, y la idempotencia de
pagos asíncronos (PSE/Nequi) que evita un segundo Pago para la misma
reserva.

Mismo patrón que test_delete_exceptions.py: SQLite en memoria, sin
mockear nada de la lógica real — se ejecuta el código de producción tal
cual contra una base de datos real (aunque en memoria).
"""
import pytest
from datetime import date
import sqlalchemy as sa
from sqlalchemy import create_engine, ARRAY
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.core.exceptions import (
    HabitacionNoDisponibleError,
    HabitacionNoEncontradaError,
    PaqueteNoEncontradoError,
)
from app.models.hotel_model import Hotel, Habitacion
from app.models.cliente_model import Cliente
from app.models.reserva_model import Reserva, ReservaHabitacion, Pago, MetodoPago
# Mismo fix que test_delete_exceptions.py: registra en el mapper de
# SQLAlchemy todos los modelos referenciados por nombre de clase en algún
# relationship() de los modelos de arriba (ej. Hotel.resenas =
# relationship("Resena", ...)), o configurar cualquier mapper revienta con
# "failed to locate a name".
from app.models.user_model import Usuario
from app.models.resena_model import Resena
from app.models.favorito_model import Favorito
from app.models.metodo_pago_guardado_model import MetodoPagoGuardado
from app.models.configuracion_model import ConfiguracionSistema
from app.models.notificacion_model import Notificacion
from app.models.empresa_model import SolicitudCorporativa
from app.models.reserva_model import SolicitudCancelacion, HistorialReserva
from app.repositories.reserva_repository import ReservaRepository, PagoRepository
from app.repositories.solicitud_cancelacion_repository import SolicitudCancelacionRepository
from app.schemas.reserva_schema import PagarRequest
from app.schemas.solicitud_cancelacion_schema import SolicitudCancelacionResolve
from app.routes import reserva_route, solicitud_cancelacion_route


SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# SQLite no soporta ARRAY (usado en preferencias_cliente.intereses) — mismo
# parche que test_delete_exceptions.py, solo para el motor de pruebas.
for table in Base.metadata.tables.values():
    for column in table.columns:
        if isinstance(column.type, ARRAY):
            column.type = sa.JSON()

Base.metadata.create_all(bind=engine)


@pytest.fixture
def db():
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    yield session
    session.close()
    Base.metadata.drop_all(bind=engine)


def _crear_hotel_y_habitacion(db, precio_noche=100000, estado="disponible"):
    hotel = Hotel(
        nombre_hotel="Hotel Test",
        direccion="Calle 1",
        telefono="123456",
        correo_electronico="hotel@test.com",
        calificacion=4,
    )
    db.add(hotel)
    db.commit()

    habitacion = Habitacion(
        id_hotel=hotel.id_hotel,
        id_tipo_habitacion=1,
        numero_habitacion="101",
        precio_noche=precio_noche,
        estado=estado,
    )
    db.add(habitacion)
    db.commit()
    return hotel, habitacion


def _crear_cliente(db, cedula="1000000001"):
    cliente = Cliente(
        nombre="Cliente",
        apellido="Test",
        cedula=cedula,
        correo=f"cliente{cedula}@test.com",
    )
    db.add(cliente)
    db.commit()
    return cliente


class TestPrecioMultiplesNoches:
    """Regresión directa del bug real: antes se guardaba precio_acordado =
    precio de UNA noche sin importar cuántas noches durara la reserva."""

    def test_precio_se_multiplica_por_las_noches_reales(self, db):
        cliente = _crear_cliente(db)
        _, habitacion = _crear_hotel_y_habitacion(db, precio_noche=100000)

        reserva = ReservaRepository.create(db, {
            "id_cliente": cliente.id_cliente,
            "numero_personas": 2,
            "fecha_inicio": date(2026, 1, 10),
            "fecha_fin": date(2026, 1, 13),
            "habitaciones": [{
                "id_habitacion": habitacion.id_habitacion,
                "fecha_checkin": date(2026, 1, 10),
                "fecha_checkout": date(2026, 1, 13),  # 3 noches
            }],
        })

        rh = db.query(ReservaHabitacion).filter(
            ReservaHabitacion.id_reserva == reserva.id_reserva
        ).first()
        assert float(rh.precio_acordado) == 100000 * 3

    def test_precio_una_sola_noche(self, db):
        cliente = _crear_cliente(db)
        _, habitacion = _crear_hotel_y_habitacion(db, precio_noche=80000)

        reserva = ReservaRepository.create(db, {
            "id_cliente": cliente.id_cliente,
            "numero_personas": 1,
            "fecha_inicio": date(2026, 2, 1),
            "fecha_fin": date(2026, 2, 2),
            "habitaciones": [{
                "id_habitacion": habitacion.id_habitacion,
                "fecha_checkin": date(2026, 2, 1),
                "fecha_checkout": date(2026, 2, 2),
            }],
        })

        rh = db.query(ReservaHabitacion).filter(
            ReservaHabitacion.id_reserva == reserva.id_reserva
        ).first()
        assert float(rh.precio_acordado) == 80000


class TestDisponibilidadHabitacion:
    """Cruce de fechas / estado de la habitación — lo que evita el
    double-booking (dos clientes con la misma habitación las mismas
    noches)."""

    def test_habitacion_inexistente(self, db):
        with pytest.raises(HabitacionNoEncontradaError):
            ReservaRepository._verificar_disponibilidad(db, 9999, date(2026, 1, 1), date(2026, 1, 2))

    def test_habitacion_en_mantenimiento_rechazada(self, db):
        _, habitacion = _crear_hotel_y_habitacion(db, estado="mantenimiento")
        with pytest.raises(HabitacionNoDisponibleError):
            ReservaRepository._verificar_disponibilidad(
                db, habitacion.id_habitacion, date(2026, 1, 1), date(2026, 1, 2)
            )

    def test_fechas_cruzadas_con_reserva_activa_rechazadas(self, db):
        cliente = _crear_cliente(db)
        _, habitacion = _crear_hotel_y_habitacion(db)

        # Reserva existente: 10 al 15 de enero, confirmada (activa)
        ReservaRepository.create(db, {
            "id_cliente": cliente.id_cliente,
            "numero_personas": 1,
            "fecha_inicio": date(2026, 1, 10),
            "fecha_fin": date(2026, 1, 15),
            "habitaciones": [{
                "id_habitacion": habitacion.id_habitacion,
                "fecha_checkin": date(2026, 1, 10),
                "fecha_checkout": date(2026, 1, 15),
            }],
        })

        # Nueva reserva que se cruza (12 al 18) debe rechazarse
        with pytest.raises(HabitacionNoDisponibleError):
            ReservaRepository._verificar_disponibilidad(
                db, habitacion.id_habitacion, date(2026, 1, 12), date(2026, 1, 18)
            )

    def test_fechas_consecutivas_sin_cruce_permitidas(self, db):
        """Salida el día 15, entrada de otro cliente el mismo día 15 (mismo
        día de turnover) NO debe considerarse un cruce — es el uso normal
        de un hotel."""
        cliente = _crear_cliente(db)
        _, habitacion = _crear_hotel_y_habitacion(db)

        ReservaRepository.create(db, {
            "id_cliente": cliente.id_cliente,
            "numero_personas": 1,
            "fecha_inicio": date(2026, 1, 10),
            "fecha_fin": date(2026, 1, 15),
            "habitaciones": [{
                "id_habitacion": habitacion.id_habitacion,
                "fecha_checkin": date(2026, 1, 10),
                "fecha_checkout": date(2026, 1, 15),
            }],
        })

        # No debe lanzar excepción
        ReservaRepository._verificar_disponibilidad(
            db, habitacion.id_habitacion, date(2026, 1, 15), date(2026, 1, 20)
        )

    def test_reserva_cancelada_no_bloquea_la_habitacion(self, db):
        cliente = _crear_cliente(db)
        _, habitacion = _crear_hotel_y_habitacion(db)

        reserva = ReservaRepository.create(db, {
            "id_cliente": cliente.id_cliente,
            "numero_personas": 1,
            "fecha_inicio": date(2026, 3, 1),
            "fecha_fin": date(2026, 3, 5),
            "habitaciones": [{
                "id_habitacion": habitacion.id_habitacion,
                "fecha_checkin": date(2026, 3, 1),
                "fecha_checkout": date(2026, 3, 5),
            }],
        })
        reserva.estado = "cancelada"
        db.commit()

        # Las mismas fechas ahora deben estar libres
        ReservaRepository._verificar_disponibilidad(
            db, habitacion.id_habitacion, date(2026, 3, 1), date(2026, 3, 5)
        )


class TestPaqueteInexistente:
    def test_id_paquete_inexistente_rechazado(self, db):
        cliente = _crear_cliente(db)
        with pytest.raises(PaqueteNoEncontradoError):
            ReservaRepository.create(db, {
                "id_cliente": cliente.id_cliente,
                "id_paquete": 9999,
                "numero_personas": 1,
                "fecha_inicio": date(2026, 1, 1),
                "fecha_fin": date(2026, 1, 2),
            })


class TestIdempotenciaPagos:
    """Fase 1 del plan de mejora: evita un segundo Pago para la misma
    reserva mientras un pago async (PSE/Nequi) sigue 'procesando'."""

    def _crear_reserva_pendiente(self, db):
        cliente = _crear_cliente(db)
        reserva = Reserva(
            id_cliente=cliente.id_cliente,
            numero_personas=1,
            estado="pendiente",
            fecha_inicio=date(2026, 1, 1),
            fecha_fin=date(2026, 1, 2),
        )
        db.add(reserva)
        db.commit()
        return reserva

    def test_no_hay_pago_en_proceso_para_reserva_nueva(self, db):
        reserva = self._crear_reserva_pendiente(db)
        assert PagoRepository.existe_pago_en_proceso(db, reserva.id_reserva) is False

    def test_detecta_pago_procesando(self, db):
        reserva = self._crear_reserva_pendiente(db)
        metodo = MetodoPago(nombre_metodo="PSE", codigo="pse")
        db.add(metodo)
        db.commit()

        pago = Pago(
            id_reserva=reserva.id_reserva,
            id_metodo_pago=metodo.id_metodo,
            monto=100000,
            estado="procesando",
        )
        db.add(pago)
        db.commit()

        assert PagoRepository.existe_pago_en_proceso(db, reserva.id_reserva) is True

    def test_pago_ya_confirmado_no_cuenta_como_en_proceso(self, db):
        """Un pago que ya terminó (pagado/rechazado) no debe bloquear un
        reintento legítimo de una reserva que sigue pendiente por otra
        razón (ej. el primer intento fue rechazado)."""
        reserva = self._crear_reserva_pendiente(db)
        metodo = MetodoPago(nombre_metodo="Tarjeta", codigo="tarjeta_credito")
        db.add(metodo)
        db.commit()

        pago = Pago(
            id_reserva=reserva.id_reserva,
            id_metodo_pago=metodo.id_metodo,
            monto=100000,
            estado="rechazado",
        )
        db.add(pago)
        db.commit()

        assert PagoRepository.existe_pago_en_proceso(db, reserva.id_reserva) is False


class _HiloSincrono:
    """Reemplaza threading.Thread dentro de un módulo de ruta para las
    pruebas: el envío de correo (Fase 2 del plan de mejora) corre en un
    hilo aparte para no bloquear la respuesta ni depender de la sesión de
    BD tras cerrarse — pero eso hace la aserción en un test una carrera
    contra el hilo real. Este doble corre el "hilo" en el mismo hilo del
    test, de forma síncrona, así se puede afirmar sobre el envío sin
    sleeps ni condiciones de carrera.
    """

    def __init__(self, target=None, daemon=None, **kwargs):
        self._target = target

    def start(self):
        if self._target:
            self._target()


class TestCorreoConfirmacionReserva:
    """Fase 2 del plan de mejora: 'Confirmación por correo' prometida en
    Checkout.tsx (líneas 561-563) sin infraestructura de envío para
    reservas. send_reservation_confirmation ya existía en app/core/mail.py
    pero solo se usaba en app/core/examples.py (no es una ruta activa) —
    estas pruebas verifican que ahora sí se llama desde el flujo real de
    pago (pagar_reserva / confirmar_pago), solo cuando la reserva de
    verdad queda 'confirmada', nunca si el pago fue rechazado."""

    def _preparar_reserva_y_metodo(self, db, codigo_metodo, nombre_metodo):
        cliente = _crear_cliente(db)
        _, habitacion = _crear_hotel_y_habitacion(db, precio_noche=150000)
        reserva = ReservaRepository.create(db, {
            "id_cliente": cliente.id_cliente,
            "numero_personas": 1,
            "fecha_inicio": date(2026, 4, 1),
            "fecha_fin": date(2026, 4, 3),
            "habitaciones": [{
                "id_habitacion": habitacion.id_habitacion,
                "fecha_checkin": date(2026, 4, 1),
                "fecha_checkout": date(2026, 4, 3),
            }],
        })
        metodo = MetodoPago(nombre_metodo=nombre_metodo, codigo=codigo_metodo)
        db.add(metodo)
        db.commit()
        usuario = Usuario(
            username=f"user{cliente.id_cliente}",
            correo_electronico=f"user{cliente.id_cliente}@test.com",
            password_hash="hash-de-prueba",
            id_cliente=cliente.id_cliente,
        )
        db.add(usuario)
        db.commit()
        return cliente, reserva, metodo, usuario

    def test_pago_aprobado_al_instante_envia_correo_de_confirmacion(self, db, monkeypatch):
        llamadas = []

        async def fake_send(**kwargs):
            llamadas.append(kwargs)
            return True

        monkeypatch.setattr(reserva_route.threading, "Thread", _HiloSincrono)
        monkeypatch.setattr(reserva_route, "send_reservation_confirmation", fake_send)

        cliente, reserva, metodo, usuario = self._preparar_reserva_y_metodo(
            db, "tarjeta_credito", "Tarjeta de crédito"
        )
        data = PagarRequest(id_metodo_pago=metodo.id_metodo, tipo_pago="completo", ultimos4="4242")

        resultado = reserva_route.pagar_reserva(
            reserva.id_reserva, data, db=db, current_user=usuario, authorization=None
        )

        assert resultado.reserva.estado == "confirmada"
        assert len(llamadas) == 1
        assert llamadas[0]["email"] == cliente.correo
        assert llamadas[0]["reservation_id"] == reserva.id_reserva
        assert llamadas[0]["guest_name"] == f"{cliente.nombre} {cliente.apellido}"

    def test_pago_rechazado_no_envia_correo_de_confirmacion(self, db, monkeypatch):
        llamadas = []

        async def fake_send(**kwargs):
            llamadas.append(kwargs)
            return True

        monkeypatch.setattr(reserva_route.threading, "Thread", _HiloSincrono)
        monkeypatch.setattr(reserva_route, "send_reservation_confirmation", fake_send)

        cliente, reserva, metodo, usuario = self._preparar_reserva_y_metodo(
            db, "tarjeta_credito", "Tarjeta de crédito"
        )
        # "0002" es el valor de prueba que payment_service siempre rechaza.
        data = PagarRequest(id_metodo_pago=metodo.id_metodo, tipo_pago="completo", ultimos4="0002")

        resultado = reserva_route.pagar_reserva(
            reserva.id_reserva, data, db=db, current_user=usuario, authorization=None
        )

        assert resultado.reserva.estado == "pendiente"
        assert resultado.pago.estado == "rechazado"
        assert llamadas == []

    def test_confirmar_pago_pse_aprobado_envia_correo_de_confirmacion(self, db, monkeypatch):
        llamadas = []

        async def fake_send(**kwargs):
            llamadas.append(kwargs)
            return True

        monkeypatch.setattr(reserva_route.threading, "Thread", _HiloSincrono)
        monkeypatch.setattr(reserva_route, "send_reservation_confirmation", fake_send)

        cliente, reserva, metodo, usuario = self._preparar_reserva_y_metodo(db, "pse", "PSE")
        # Documento normal (no "0000000000") -> se aprueba al confirmar.
        data = PagarRequest(
            id_metodo_pago=metodo.id_metodo, tipo_pago="completo",
            banco="Bancolombia", documento="123456789",
        )

        inicio = reserva_route.pagar_reserva(
            reserva.id_reserva, data, db=db, current_user=usuario, authorization=None
        )
        # PSE queda 'procesando' de inmediato — todavía no se manda nada.
        assert inicio.pago.estado == "procesando"
        assert llamadas == []

        pago_id = inicio.pago.id_pago
        resultado = reserva_route.confirmar_pago(
            pago_id, db=db, current_user=usuario, authorization=None
        )

        assert resultado.reserva.estado == "confirmada"
        assert len(llamadas) == 1
        assert llamadas[0]["email"] == cliente.correo
        assert llamadas[0]["reservation_id"] == reserva.id_reserva


class TestCorreoCancelacionReserva:
    """Misma fase del plan de mejora: aprobar una solicitud de cancelación
    ahora sí avisa por correo al cliente de que su reserva quedó cancelada
    de verdad (send_cancellation_email, antes también sin ningún punto de
    llamada real)."""

    def test_aprobar_solicitud_cancela_la_reserva_y_envia_correo(self, db, monkeypatch):
        llamadas = []

        async def fake_send(**kwargs):
            llamadas.append(kwargs)
            return True

        monkeypatch.setattr(solicitud_cancelacion_route.threading, "Thread", _HiloSincrono)
        monkeypatch.setattr(solicitud_cancelacion_route, "send_cancellation_email", fake_send)

        cliente = _crear_cliente(db)
        reserva = Reserva(
            id_cliente=cliente.id_cliente,
            numero_personas=1,
            estado="pendiente",
            fecha_inicio=date(2026, 5, 1),
            fecha_fin=date(2026, 5, 3),
        )
        db.add(reserva)
        db.commit()

        solicitud = SolicitudCancelacionRepository.create(
            db,
            id_reserva=reserva.id_reserva,
            id_cliente=cliente.id_cliente,
            motivo="Cambio de planes personales",
            motivo_detalle=None,
        )

        data = SolicitudCancelacionResolve(estado="aprobada", comentario_resolucion="Aprobado por soporte")
        resultado = solicitud_cancelacion_route.admin_resolver_solicitud(
            solicitud.id_solicitud, data, db=db, admin_id=1
        )

        assert resultado.estado == "aprobada"
        db.refresh(reserva)
        assert reserva.estado == "cancelada"
        assert len(llamadas) == 1
        assert llamadas[0]["email"] == cliente.correo
        assert llamadas[0]["reservation_id"] == reserva.id_reserva

    def test_rechazar_solicitud_no_cancela_ni_envia_correo(self, db, monkeypatch):
        llamadas = []

        async def fake_send(**kwargs):
            llamadas.append(kwargs)
            return True

        monkeypatch.setattr(solicitud_cancelacion_route.threading, "Thread", _HiloSincrono)
        monkeypatch.setattr(solicitud_cancelacion_route, "send_cancellation_email", fake_send)

        cliente = _crear_cliente(db)
        reserva = Reserva(
            id_cliente=cliente.id_cliente,
            numero_personas=1,
            estado="pendiente",
            fecha_inicio=date(2026, 6, 1),
            fecha_fin=date(2026, 6, 3),
        )
        db.add(reserva)
        db.commit()

        solicitud = SolicitudCancelacionRepository.create(
            db,
            id_reserva=reserva.id_reserva,
            id_cliente=cliente.id_cliente,
            motivo="Cambio de planes personales",
            motivo_detalle=None,
        )

        data = SolicitudCancelacionResolve(estado="rechazada", comentario_resolucion="No aplica reembolso")
        resultado = solicitud_cancelacion_route.admin_resolver_solicitud(
            solicitud.id_solicitud, data, db=db, admin_id=1
        )

        assert resultado.estado == "rechazada"
        db.refresh(reserva)
        assert reserva.estado == "pendiente"
        assert llamadas == []
