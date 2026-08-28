import { apiFetch } from "../api/v1/api";

export interface TendenciaValor {
  actual: number;
  anterior: number;
  /** null cuando el período anterior no tiene datos suficientes para un
   * porcentaje real — nunca se calcula un +/-100% inventado desde cero. */
  variacion_pct: number | null;
}

export interface ReservaProximaItem {
  id_reserva: number;
  cliente_nombre: string;
  hotel_nombre: string | null;
  nombre_paquete: string | null;
  fecha_inicio: string;
  fecha_fin: string;
  numero_personas: number;
  estado: string;
}

export interface ConteoNombre {
  nombre: string;
  total: number;
  monto: number | null;
}

export interface ReservasPorMesItem {
  mes: string; // "2026-06"
  total: number;
}

// Espejo exacto de DashboardResumenResponse (backend/app/schemas/dashboard_schema.py).
// Todo lo que llega en null significa "no hay información real suficiente para
// calcular esto todavía" — nunca se debe reemplazar por un 0 inventado en la UI.
export interface DashboardResumen {
  reservas_total: number;
  reservas_confirmadas: number;
  reservas_pendientes: number;
  reservas_canceladas: number;
  reservas_finalizadas: number;

  pagos_pagados: number;
  pagos_pendientes: number;
  pagos_fallidos: number;
  pagos_reembolsados: number | null;
  ingresos_totales: number;
  ticket_promedio: number | null;

  clientes_total: number;
  clientes_nuevos_mes: number;
  clientes_activos: number;
  clientes_con_reserva_proxima: number;

  checkins_proximos_7d: number;
  checkouts_proximos_7d: number;
  solicitudes_cancelacion_pendientes: number;
  contactos_empresariales_pendientes: number | null;

  tendencia_reservas: TendenciaValor;
  tendencia_ingresos: TendenciaValor;
  tendencia_cancelaciones: TendenciaValor;
  tendencia_clientes_nuevos: TendenciaValor;

  reservas_por_estado: Record<string, number>;
  ingresos_por_metodo: ConteoNombre[];
  paquetes_mas_solicitados: ConteoNombre[];
  reservas_por_mes: ReservasPorMesItem[];
  cancelaciones_por_mes: ReservasPorMesItem[];

  reservas_proximas: ReservaProximaItem[];

  hoteles_activos: number;
  paquetes_activos: number;
}

export const dashboardService = {
  getResumen: () => apiFetch<DashboardResumen>("/dashboard/resumen"),
};
