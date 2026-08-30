"""
Endpoint de resumen operativo del Dashboard del admin.

Por qué existe este archivo (y no seguir calculando todo en el frontend
como antes): el Dashboard anterior calculaba TODOS sus KPIs en JavaScript
a partir de listas ya paginadas (`GET /reservas?limit=100`, `GET /pagos?limit=100`)
que el resto del panel usa para sus tablas. Eso significa que apenas la
agencia supere 100 reservas o 100 pagos reales, "Total Reservas", "Ingresos
totales", el gráfico de estados, etc. empiezan a estar SILENCIOSAMENTE mal
— nunca fallan, simplemente cuentan de menos sin avisar. Este endpoint
calcula cada número con SQL de verdad (COUNT/SUM/GROUP BY sobre la tabla
completa), así que es correcto sin importar cuántas reservas existan.

Todas las cifras salen de tablas reales ya existentes (reservas, pagos,
clientes, hoteles, paquetes, solicitudes_cancelacion, historial_reservas).
No se inventa ningún número: donde no hay suficiente información para una
cifra real (reembolsos, contactos empresariales si la migración todavía no
corrió), el campo va en None en vez de mostrar un 0 que podría confundirse
con "sabemos que son cero".
"""

from calendar import monthrange
from datetime import date, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.core.cache import get_cached, set_cached
from app.core.database import get_db
from app.core.security import require_admin
from app.models.cliente_model import Cliente
from app.models.hotel_model import Hotel
from app.models.reserva_model import HistorialReserva, MetodoPago, Pago, Paquete, Reserva, SolicitudCancelacion
from app.schemas.dashboard_schema import (
    ConteoNombre,
    DashboardResumenResponse,
    ReservaProximaItem,
    ReservasPorMesItem,
    SerieDiariaItem,
    TendenciaValor,
)

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

DASHBOARD_CACHE_KEY = "kpi:dashboard:resumen"
DASHBOARD_CACHE_TTL = 60  # corto: el dashboard debe reflejar cambios casi en vivo


def _inicio_mes(d: date) -> date:
    return d.replace(day=1)


def _mes_anterior(d: date) -> tuple[date, date]:
    """Devuelve (inicio, fin_exclusivo) del mes calendario anterior a `d`."""
    fin = _inicio_mes(d)
    if fin.month == 1:
        inicio = fin.replace(year=fin.year - 1, month=12, day=1)
    else:
        inicio = fin.replace(month=fin.month - 1, day=1)
    return inicio, fin


def _variacion(actual: float, anterior: float) -> TendenciaValor:
    pct = None
    if anterior > 0:
        pct = round((actual - anterior) / anterior * 100, 1)
    return TendenciaValor(actual=actual, anterior=anterior, variacion_pct=pct)


@router.get("/resumen", response_model=DashboardResumenResponse)
def get_dashboard_resumen(db: Session = Depends(get_db), admin_id: int = Depends(require_admin)):
    cached = get_cached(DASHBOARD_CACHE_KEY)
    if cached is not None:
        return cached

    hoy = date.today()
    inicio_mes_actual = _inicio_mes(hoy)
    inicio_mes_anterior, fin_mes_anterior = _mes_anterior(hoy)
    en_7_dias = hoy + timedelta(days=7)

    # ---------- Reservas por estado (real, tabla completa) ----------
    conteo_estado = dict(db.query(Reserva.estado, func.count(Reserva.id_reserva)).group_by(Reserva.estado).all())
    reservas_total = sum(conteo_estado.values())

    # ---------- Pagos por estado + ingresos reales ----------
    conteo_pago_estado = dict(db.query(Pago.estado, func.count(Pago.id_pago)).group_by(Pago.estado).all())
    ingresos_totales = float(
        db.query(func.coalesce(func.sum(Pago.monto), 0)).filter(Pago.estado == "pagado").scalar() or 0
    )
    pagos_pagados_count = conteo_pago_estado.get("pagado", 0)
    ticket_promedio = round(ingresos_totales / pagos_pagados_count, 2) if pagos_pagados_count else None

    # ---------- Clientes ----------
    clientes_total = db.query(func.count(Cliente.id_cliente)).scalar() or 0
    clientes_nuevos_mes = (
        db.query(func.count(Cliente.id_cliente)).filter(Cliente.fecha_registro >= inicio_mes_actual).scalar() or 0
    )
    clientes_activos = db.query(func.count(func.distinct(Reserva.id_cliente))).scalar() or 0
    clientes_con_reserva_proxima = (
        db.query(func.count(func.distinct(Reserva.id_cliente)))
        .filter(Reserva.fecha_inicio >= hoy, Reserva.estado.in_(["confirmada", "pendiente"]))
        .scalar()
        or 0
    )

    # ---------- Operación ----------
    checkins_proximos_7d = (
        db.query(func.count(Reserva.id_reserva))
        .filter(Reserva.fecha_inicio.between(hoy, en_7_dias), Reserva.estado == "confirmada")
        .scalar()
        or 0
    )
    checkouts_proximos_7d = (
        db.query(func.count(Reserva.id_reserva))
        .filter(Reserva.fecha_fin.between(hoy, en_7_dias), Reserva.estado == "confirmada")
        .scalar()
        or 0
    )
    solicitudes_cancelacion_pendientes = (
        db.query(func.count(SolicitudCancelacion.id_solicitud))
        .filter(SolicitudCancelacion.estado == "pendiente")
        .scalar()
        or 0
    )

    # Empresas/Contactos: tabla nueva de esta misma sesión — puede no existir
    # todavía si el usuario no corrió `alembic upgrade head`. Nunca debe
    # tumbar el resto del dashboard por eso.
    contactos_empresariales_pendientes = None
    try:
        from app.models.empresa_model import SolicitudCorporativa

        contactos_empresariales_pendientes = (
            db.query(func.count(SolicitudCorporativa.id_solicitud))
            .filter(SolicitudCorporativa.estado == "nuevo")
            .scalar()
            or 0
        )
    except Exception:
        db.rollback()
        contactos_empresariales_pendientes = None

    # ---------- Tendencias: mes actual vs. mes calendario anterior ----------
    reservas_mes_actual = (
        db.query(func.count(Reserva.id_reserva)).filter(Reserva.fecha_reserva >= inicio_mes_actual).scalar() or 0
    )
    reservas_mes_anterior = (
        db.query(func.count(Reserva.id_reserva))
        .filter(Reserva.fecha_reserva >= inicio_mes_anterior, Reserva.fecha_reserva < fin_mes_anterior)
        .scalar()
        or 0
    )

    ingresos_mes_actual = float(
        db.query(func.coalesce(func.sum(Pago.monto), 0))
        .filter(Pago.estado == "pagado", Pago.fecha_pago >= inicio_mes_actual)
        .scalar()
        or 0
    )
    ingresos_mes_anterior = float(
        db.query(func.coalesce(func.sum(Pago.monto), 0))
        .filter(Pago.estado == "pagado", Pago.fecha_pago >= inicio_mes_anterior, Pago.fecha_pago < fin_mes_anterior)
        .scalar()
        or 0
    )

    # Cancelaciones: se cuentan por el momento REAL en que pasaron a
    # 'cancelada' (historial_reservas.fecha_cambio), no por la fecha en que
    # se creó la reserva originalmente — son eventos distintos.
    cancelaciones_mes_actual = (
        db.query(func.count(HistorialReserva.id_historial))
        .filter(HistorialReserva.estado_nuevo == "cancelada", HistorialReserva.fecha_cambio >= inicio_mes_actual)
        .scalar()
        or 0
    )
    cancelaciones_mes_anterior = (
        db.query(func.count(HistorialReserva.id_historial))
        .filter(
            HistorialReserva.estado_nuevo == "cancelada",
            HistorialReserva.fecha_cambio >= inicio_mes_anterior,
            HistorialReserva.fecha_cambio < fin_mes_anterior,
        )
        .scalar()
        or 0
    )

    clientes_nuevos_mes_anterior = (
        db.query(func.count(Cliente.id_cliente))
        .filter(Cliente.fecha_registro >= inicio_mes_anterior, Cliente.fecha_registro < fin_mes_anterior)
        .scalar()
        or 0
    )

    # ---------- Gráficos ----------
    ingresos_por_metodo_rows = (
        db.query(MetodoPago.nombre_metodo, func.sum(Pago.monto))
        .join(Pago, Pago.id_metodo_pago == MetodoPago.id_metodo)
        .filter(Pago.estado == "pagado")
        .group_by(MetodoPago.nombre_metodo)
        .order_by(func.sum(Pago.monto).desc())
        .all()
    )
    ingresos_por_metodo = [ConteoNombre(nombre=n, total=0, monto=float(m or 0)) for n, m in ingresos_por_metodo_rows]

    paquetes_top_rows = (
        db.query(Paquete.nombre_paquete, func.count(Reserva.id_reserva))
        .join(Reserva, Reserva.id_paquete == Paquete.id_paquete)
        .group_by(Paquete.nombre_paquete)
        .order_by(func.count(Reserva.id_reserva).desc())
        .limit(8)
        .all()
    )
    paquetes_mas_solicitados = [ConteoNombre(nombre=n, total=c) for n, c in paquetes_top_rows]

    # Reservas por mes — últimos 6 meses calendario, incluyendo meses en
    # cero (para que el gráfico no "salte" cuando un mes no tuvo reservas).
    reservas_por_mes: list[ReservasPorMesItem] = []
    cancelaciones_por_mes: list[ReservasPorMesItem] = []
    cursor = inicio_mes_actual
    meses_rango = []
    for i in range(5, -1, -1):
        y, m = cursor.year, cursor.month - i
        while m <= 0:
            m += 12
            y -= 1
        meses_rango.append((y, m))
    for y, m in meses_rango:
        inicio = date(y, m, 1)
        fin = date(y, m, monthrange(y, m)[1]) + timedelta(days=1)
        total = (
            db.query(func.count(Reserva.id_reserva))
            .filter(Reserva.fecha_reserva >= inicio, Reserva.fecha_reserva < fin)
            .scalar()
            or 0
        )
        reservas_por_mes.append(ReservasPorMesItem(mes=f"{y:04d}-{m:02d}", total=total))
        # Igual que la tendencia mensual de cancelaciones más arriba: se
        # cuenta por el momento real del cambio de estado (historial), no
        # por la fecha de creación de la reserva.
        canceladas_mes = (
            db.query(func.count(HistorialReserva.id_historial))
            .filter(
                HistorialReserva.estado_nuevo == "cancelada",
                HistorialReserva.fecha_cambio >= inicio,
                HistorialReserva.fecha_cambio < fin,
            )
            .scalar()
            or 0
        )
        cancelaciones_por_mes.append(ReservasPorMesItem(mes=f"{y:04d}-{m:02d}", total=canceladas_mes))

    # ---------- Reservas próximas (para la lista "Reservas próximas") ----------
    proximas = (
        db.query(Reserva)
        .options(joinedload(Reserva.cliente), joinedload(Reserva.paquete))
        .filter(Reserva.fecha_inicio >= hoy, Reserva.estado.in_(["confirmada", "pendiente"]))
        .order_by(Reserva.fecha_inicio.asc())
        .limit(8)
        .all()
    )
    reservas_proximas = [
        ReservaProximaItem(
            id_reserva=r.id_reserva,
            cliente_nombre=f"{r.cliente.nombre} {r.cliente.apellido}" if r.cliente else "Cliente",
            hotel_nombre=r.hotel_nombre,
            nombre_paquete=r.nombre_paquete,
            fecha_inicio=r.fecha_inicio,
            fecha_fin=r.fecha_fin,
            numero_personas=r.numero_personas,
            estado=r.estado,
        )
        for r in proximas
    ]

    hoteles_activos = db.query(func.count(Hotel.id_hotel)).scalar() or 0
    paquetes_activos = db.query(func.count(Paquete.id_paquete)).filter(Paquete.activo == True).scalar() or 0  # noqa: E712

    # ---------- Métricas derivadas (nada inventado: todo sale de las
    # cuentas por estado y de historial_reservas que ya se calculan arriba
    # o son igual de directas) ----------
    tasa_conversion_pct = (
        round(conteo_estado.get("confirmada", 0) / reservas_total * 100, 1) if reservas_total else None
    )
    tasa_cancelacion_pct = (
        round(conteo_estado.get("cancelada", 0) / reservas_total * 100, 1) if reservas_total else None
    )

    # Tiempo promedio de confirmación: por cada reserva, el primer momento
    # en que su historial registra el paso a 'confirmada' (MIN por si algún
    # caso raro tuviera más de un registro), contra la fecha de creación de
    # esa misma reserva — promediado sobre todas las reservas que alguna
    # vez se confirmaron.
    primera_confirmacion = (
        db.query(
            HistorialReserva.id_reserva.label("id_reserva"),
            func.min(HistorialReserva.fecha_cambio).label("fecha_confirmacion"),
        )
        .filter(HistorialReserva.estado_nuevo == "confirmada")
        .group_by(HistorialReserva.id_reserva)
        .subquery()
    )
    horas_promedio_confirmacion = (
        db.query(
            func.avg(func.extract("epoch", primera_confirmacion.c.fecha_confirmacion - Reserva.fecha_reserva) / 3600.0)
        )
        .join(primera_confirmacion, primera_confirmacion.c.id_reserva == Reserva.id_reserva)
        .scalar()
    )
    tiempo_promedio_confirmacion_horas = (
        round(float(horas_promedio_confirmacion), 1) if horas_promedio_confirmacion is not None else None
    )

    # ---------- Series diarias (últimos 14 días, para sparklines) ----------
    reservas_ultimos_14d: list[SerieDiariaItem] = []
    ingresos_ultimos_14d: list[SerieDiariaItem] = []
    for i in range(13, -1, -1):
        dia = hoy - timedelta(days=i)
        dia_fin = dia + timedelta(days=1)
        total_reservas_dia = (
            db.query(func.count(Reserva.id_reserva))
            .filter(Reserva.fecha_reserva >= dia, Reserva.fecha_reserva < dia_fin)
            .scalar()
            or 0
        )
        reservas_ultimos_14d.append(SerieDiariaItem(fecha=dia.isoformat(), total=total_reservas_dia))

        ingresos_dia = float(
            db.query(func.coalesce(func.sum(Pago.monto), 0))
            .filter(Pago.estado == "pagado", Pago.fecha_pago >= dia, Pago.fecha_pago < dia_fin)
            .scalar()
            or 0
        )
        ingresos_ultimos_14d.append(SerieDiariaItem(fecha=dia.isoformat(), total=ingresos_dia))

    resultado = DashboardResumenResponse(
        reservas_total=reservas_total,
        reservas_confirmadas=conteo_estado.get("confirmada", 0),
        reservas_pendientes=conteo_estado.get("pendiente", 0),
        reservas_canceladas=conteo_estado.get("cancelada", 0),
        reservas_finalizadas=conteo_estado.get("finalizada", 0),
        pagos_pagados=pagos_pagados_count,
        pagos_pendientes=conteo_pago_estado.get("pendiente", 0) + conteo_pago_estado.get("procesando", 0),
        pagos_fallidos=conteo_pago_estado.get("rechazado", 0),
        pagos_reembolsados=None,
        ingresos_totales=ingresos_totales,
        ticket_promedio=ticket_promedio,
        clientes_total=clientes_total,
        clientes_nuevos_mes=clientes_nuevos_mes,
        clientes_activos=clientes_activos,
        clientes_con_reserva_proxima=clientes_con_reserva_proxima,
        checkins_proximos_7d=checkins_proximos_7d,
        checkouts_proximos_7d=checkouts_proximos_7d,
        solicitudes_cancelacion_pendientes=solicitudes_cancelacion_pendientes,
        contactos_empresariales_pendientes=contactos_empresariales_pendientes,
        tendencia_reservas=_variacion(reservas_mes_actual, reservas_mes_anterior),
        tendencia_ingresos=_variacion(ingresos_mes_actual, ingresos_mes_anterior),
        tendencia_cancelaciones=_variacion(cancelaciones_mes_actual, cancelaciones_mes_anterior),
        tendencia_clientes_nuevos=_variacion(clientes_nuevos_mes, clientes_nuevos_mes_anterior),
        reservas_por_estado=conteo_estado,
        ingresos_por_metodo=ingresos_por_metodo,
        paquetes_mas_solicitados=paquetes_mas_solicitados,
        reservas_por_mes=reservas_por_mes,
        cancelaciones_por_mes=cancelaciones_por_mes,
        reservas_proximas=reservas_proximas,
        hoteles_activos=hoteles_activos,
        paquetes_activos=paquetes_activos,
        tasa_conversion_pct=tasa_conversion_pct,
        tasa_cancelacion_pct=tasa_cancelacion_pct,
        tiempo_promedio_confirmacion_horas=tiempo_promedio_confirmacion_horas,
        reservas_ultimos_14d=reservas_ultimos_14d,
        ingresos_ultimos_14d=ingresos_ultimos_14d,
    )

    data = resultado.model_dump(mode="json")
    set_cached(DASHBOARD_CACHE_KEY, data, ttl_seconds=DASHBOARD_CACHE_TTL)
    return data
