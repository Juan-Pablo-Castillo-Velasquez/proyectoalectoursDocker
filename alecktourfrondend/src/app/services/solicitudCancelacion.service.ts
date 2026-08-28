// Guardar como: alecktourfrondend/src/app/services/solicitudCancelacion.service.ts

import { apiFetch } from '../api/v1/api';

export interface SolicitudCancelacionCreateInput {
  motivo: string;
  motivo_detalle?: string;
}

export interface SolicitudCancelacionResponse {
  id_solicitud: number;
  id_reserva: number;
  id_cliente: number;
  motivo: string;
  motivo_detalle: string | null;
  estado: 'pendiente' | 'aprobada' | 'rechazada';
  fecha_solicitud: string;
  fecha_resolucion: string | null;
  comentario_resolucion: string | null;
  // Ya existía en la BD (SolicitudCancelacion.id_empleado_resolutor), ahora
  // el backend también lo expone en la respuesta (ver solicitud_cancelacion_schema.py).
  id_empleado_resolutor: number | null;
}

export interface SolicitudCancelacionResolveInput {
  estado: 'aprobada' | 'rechazada';
  // El backend ahora lo exige (ver SolicitudCancelacionResolve) — motivo
  // interno obligatorio para cada decisión de aprobar/rechazar.
  comentario_resolucion: string;
}

// Requiere sesión iniciada (Authorization: Bearer, igual que resenaService).
// El backend valida que la reserva sea del cliente autenticado.
export const solicitudCancelacionService = {
  crear: (reservaId: number, data: SolicitudCancelacionCreateInput) =>
    apiFetch<SolicitudCancelacionResponse>(
      `/reservas/${reservaId}/solicitud-cancelacion`,
      { method: 'POST', body: data },
    ),

  getByCliente: (clienteId: number, skip = 0, limit = 10) =>
    apiFetch<SolicitudCancelacionResponse[]>(
      `/clientes/${clienteId}/solicitudes-cancelacion?skip=${skip}&limit=${limit}`,
    ),

  // Admin: requiere rol "admin" en el JWT. limit=200 es el máximo real que
  // acepta el backend (Query(..., le=200) en solicitud_cancelacion_route.py)
  // — se pide explícito en vez del default de 100 para que, si algún día
  // hay más de 100 solicitudes, las pendientes más antiguas no queden
  // fuera silenciosamente (el backend ya las prioriza, pero solo dentro
  // del límite que se le pida).
  getAll: (estado?: string) =>
    apiFetch<SolicitudCancelacionResponse[]>(
      `/solicitudes-cancelacion?limit=200${estado ? `&estado=${estado}` : ''}`,
    ),

  resolver: (idSolicitud: number, data: SolicitudCancelacionResolveInput) =>
    apiFetch<SolicitudCancelacionResponse>(
      `/solicitudes-cancelacion/${idSolicitud}/resolver`,
      { method: 'PUT', body: data },
    ),
};