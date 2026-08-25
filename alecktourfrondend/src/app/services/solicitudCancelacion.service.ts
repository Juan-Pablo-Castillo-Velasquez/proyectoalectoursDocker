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
}

export interface SolicitudCancelacionResolveInput {
  estado: 'aprobada' | 'rechazada';
  comentario_resolucion?: string;
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

  // Admin: requiere rol "admin" en el JWT.
  getAll: (estado?: string) =>
    apiFetch<SolicitudCancelacionResponse[]>(
      `/solicitudes-cancelacion${estado ? `?estado=${estado}` : ''}`,
    ),

  resolver: (idSolicitud: number, data: SolicitudCancelacionResolveInput) =>
    apiFetch<SolicitudCancelacionResponse>(
      `/solicitudes-cancelacion/${idSolicitud}/resolver`,
      { method: 'PUT', body: data },
    ),
};