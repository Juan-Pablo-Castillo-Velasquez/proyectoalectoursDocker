from pydantic import BaseModel
from typing import Optional, List
from datetime import date


class TendenciaValor(BaseModel):
    """Un valor con su variación real contra el período (mes calendario)
    anterior. `variacion_pct` es None cuando el período anterior no tiene
    datos suficientes para calcular un porcentaje real (evita inventar un
    +/-100% falso al dividir desde cero) — el frontend debe mostrar
    'Sin datos suficientes' en ese caso, nunca un número inventado."""
    actual: float
    anterior: float
    variacion_pct: Optional[float] = None


class ReservaProximaItem(BaseModel):
    id_reserva: int
    cliente_nombre: str
    hotel_nombre: Optional[str] = None
    nombre_paquete: Optional[str] = None
    fecha_inicio: date
    fecha_fin: date
    numero_personas: int
    estado: str


class ConteoNombre(BaseModel):
    nombre: str
    total: int
    monto: Optional[float] = None


class ReservasPorMesItem(BaseModel):
    mes: str  # "2026-06"
    total: int


class DashboardResumenResponse(BaseModel):
    # ---- Reservas ----
    reservas_total: int
    reservas_confirmadas: int
    reservas_pendientes: int
    reservas_canceladas: int
    reservas_finalizadas: int

    # ---- Pagos (ingresos_totales solo cuenta pagos con estado 'pagado' —
    # un pago pendiente o rechazado nunca es ingreso real) ----
    pagos_pagados: int
    pagos_pendientes: int
    pagos_fallidos: int
    # No existe todavía el concepto de reembolso en el modelo de Pago —
    # None a propósito, nunca 0 fabricado (0 significaría "sabemos que no
    # hay ninguno", que no es lo mismo que "no lo medimos todavía").
    pagos_reembolsados: Optional[int] = None
    ingresos_totales: float
    ticket_promedio: Optional[float] = None

    # ---- Clientes ----
    clientes_total: int
    clientes_nuevos_mes: int
    # "Activo" = tiene al menos una reserva registrada (no es un flag en BD,
    # es una definición de negocio real y consistente, no inventada por
    # reserva individual).
    clientes_activos: int
    clientes_con_reserva_proxima: int

    # ---- Operación ----
    checkins_proximos_7d: int
    checkouts_proximos_7d: int
    solicitudes_cancelacion_pendientes: int
    # None si la tabla solicitudes_corporativas todavía no existe en esta
    # base de datos (migración f1b8d3a75c26 pendiente de `alembic upgrade head`).
    contactos_empresariales_pendientes: Optional[int] = None

    # ---- Tendencias: mes calendario actual vs. el anterior ----
    tendencia_reservas: TendenciaValor
    tendencia_ingresos: TendenciaValor
    tendencia_cancelaciones: TendenciaValor
    tendencia_clientes_nuevos: TendenciaValor

    # ---- Gráficos ----
    reservas_por_estado: dict
    ingresos_por_metodo: List[ConteoNombre]
    paquetes_mas_solicitados: List[ConteoNombre]
    reservas_por_mes: List[ReservasPorMesItem]
    cancelaciones_por_mes: List[ReservasPorMesItem]

    reservas_proximas: List[ReservaProximaItem]

    hoteles_activos: int
    paquetes_activos: int
