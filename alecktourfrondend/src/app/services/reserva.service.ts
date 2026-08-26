import { apiFetch } from '../api/v1/api';
import { ReservaCreate, ReservaResponse } from '../data/reservaTypes';

export type CodigoMetodoPago =
  | 'tarjeta_credito'
  | 'tarjeta_debito'
  | 'pse'
  | 'nequi'
  | 'paypal'
  | 'efectivo'
  | 'transferencia'
  | 'cripto'
  | 'daviplata'
  | 'cheque'
  | 'otro';

export interface MetodoPago {
  id_metodo: number;
  nombre_metodo: string;
  codigo: CodigoMetodoPago;
}

export interface PagoCreate {
  id_reserva: number;
  id_metodo_pago: number;
  monto: number;
  referencia: string;
}

export interface PagoResponse {
  id_pago: number;
  id_reserva: number;
  id_metodo_pago: number;
  monto: number;
  fecha_pago: string;
  referencia: string;
  estado: string;
  metodo_pago: MetodoPago;
}

export interface ReservaDetail {
  id_reserva: number;
  id_cliente: number;
  id_paquete: number;
  fecha_reserva: string;
  fecha_inicio: string;
  fecha_fin: string;
  numero_personas: number;
  estado: string;
  precio_total?: number;
  paquete?: {
    id_paquete: number;
    nombre_paquete: string;
    descripcion: string;
    precio_por_persona: number;
    id_hotel: number;
    hotel?: {
      nombre_hotel: string;
      ciudad: string;
      pais: string;
      calificacion: number;
    };
  };
  pagos?: PagoResponse[];
  empleado?: {
    id_empleado: number;
    nombre: string;
    apellido: string;
    correo_electronico?: string | null;
    celular?: string | null;
  } | null;
  canal_origen?: string | null;
}

export interface PagarRequest {
  id_metodo_pago: number;
  tipo_pago: 'completo' | 'parcial';
  // Especificos por metodo, nunca se manda el numero completo de tarjeta:
  ultimos4?: string;   // tarjeta
  celular?: string;    // nequi
  banco?: string;      // pse
  documento?: string;  // pse
}

export interface PagarResponse {
  pago: PagoResponse;
  reserva: ReservaResponse;
}

export const reservaService = {
  getAll: (skip = 0, limit = 50) =>
    apiFetch<ReservaResponse[]>(`/reservas?skip=${skip}&limit=${limit}`),
  getById: (id: number) =>
    apiFetch<ReservaResponse>(`/reservas/${id}`),
  getByCliente: (clienteId: number) =>
    apiFetch<ReservaResponse[]>(`/reservas/cliente/${clienteId}`),
  getDetail: (id: number) =>
    apiFetch<ReservaDetail>(`/reservas/${id}`),
  getPagos: (reservaId: number) =>
    apiFetch<PagoResponse[]>(`/pagos/reserva/${reservaId}`),
  create: (data: ReservaCreate) =>
    apiFetch<ReservaResponse>('/reservas', { method: 'POST', body: data }),
  update: (id: number, data: Partial<ReservaCreate>) =>
    apiFetch<ReservaResponse>(`/reservas/${id}`, { method: 'PUT', body: data }),
  delete: (id: number) =>
    apiFetch<{ message: string }>(`/reservas/${id}`, { method: 'DELETE' }),

  // El backend calcula y valida el monto real (habitaciones + servicios de la
  // reserva) — nunca se manda un monto calculado en el navegador.
  pagar: (id: number, data: PagarRequest) =>
    apiFetch<PagarResponse>(`/reservas/${id}/pagar`, { method: 'POST', body: data }),

  updateEstado: (id: number, estado: string) =>
    apiFetch<ReservaResponse>(`/reservas/${id}`, {
      method: 'PUT',
      body: { estado },   // ReservaUpdate tiene exclude_unset=True, así que solo manda esto
    }),
};


export const pagoService = {
  getMetodos: () =>
    apiFetch<MetodoPago[]>('/metodos-pago'),
  create: (data: PagoCreate) =>
    apiFetch<PagoResponse>('/pagos', { method: 'POST', body: data }),
  // Confirma un pago que quedo 'procesando' (PSE/Nequi) — simula que el
  // banco o la app ya respondieron. Tarjeta/PayPal/otros no necesitan esto,
  // resuelven al instante dentro de reservaService.pagar().
  confirmar: (idPago: number) =>
    apiFetch<PagarResponse>(`/pagos/${idPago}/confirmar`, { method: 'POST' }),
};


export interface ActividadRecienteItem {
  id_historial: number;
  id_reserva: number;
  estado_anterior: string | null;
  estado_nuevo: string | null;
  fecha_cambio: string;
  comentarios: string | null;
  nombre_empleado: string | null;
}

export const reservaDetailService = {
  getHabitaciones: (id: number) =>
    apiFetch<any[]>(`/reservas/${id}/habitaciones`),
  getServicios: (id: number) =>
    apiFetch<any[]>(`/reservas/${id}/servicios`),
  getHistorial: (id: number) =>
    apiFetch<any[]>(`/reservas/${id}/historial`),
  // Feed de actividad reciente para el Dashboard de admin — últimos cambios
  // de estado de TODAS las reservas (no de una sola), más recientes
  // primero. Ver GET /historial-reservas/recientes en reserva_route.py.
  getActividadReciente: (limit = 15) =>
    apiFetch<ActividadRecienteItem[]>(`/historial-reservas/recientes?limit=${limit}`),
};