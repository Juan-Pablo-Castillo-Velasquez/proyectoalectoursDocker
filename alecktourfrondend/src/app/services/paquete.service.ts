import { apiFetch } from '../api/v1/api';

export interface PaquetePopular {
  id_paquete: number;
  nombre_paquete: string;
  descripcion: string;
  duracion_dias: number;
  precio_base: number;
  activo: boolean;
  total_reservas: number;
  calificacion_estimada: number;
}

export interface PaqueteResponse {
  id_paquete: number;
  nombre_paquete: string;
  descripcion: string;
  duracion_dias: number;
  precio_base: number;
  activo: boolean;
}

export interface PaqueteHotelDetalle {
  id_hotel: number;
  nombre_hotel: string;
  ciudad: string | null;
  pais: string | null;
  calificacion: number | null;
  noches_incluidas: number | null;
  caracteristicas: string[];
}

export interface PaqueteServicioDetalle {
  nombre_servicio: string;
  categoria: string | null;
  descripcion: string | null;
  dia_actividad: number | null;
  incluido: boolean;
}

// Igual que PaqueteResponse pero con destinos/hoteles/servicios reales —
// usado en la página de detalle del paquete (antes mostraba datos de
// ejemplo hardcodeados desde data/packages.ts).
export interface PaqueteDetalleResponse extends PaqueteResponse {
  destinos: string[];
  hoteles: PaqueteHotelDetalle[];
  servicios: PaqueteServicioDetalle[];
}

export const paqueteService = {
  getAll: (skip = 0, limit = 10) =>
    apiFetch<PaqueteResponse[]>(`/paquetes?skip=${skip}&limit=${limit}`),

  getById: (id: number) =>
    apiFetch<PaqueteResponse>(`/paquetes/${id}`),

  getDetalle: (id: number) =>
    apiFetch<PaqueteDetalleResponse>(`/paquetes/${id}/detalle`),

  // Usa la vista vista_paquetes_populares del backend
  getPopulares: (limit = 6) =>
    apiFetch<PaquetePopular[]>(`/paquetes/populares?limit=${limit}`),

  create: (data: Partial<PaqueteResponse>) =>
    apiFetch<PaqueteResponse>('/paquetes', { method: 'POST', body: data }),

  update: (id: number, data: Partial<PaqueteResponse>) =>
    apiFetch<PaqueteResponse>(`/paquetes/${id}`, { method: 'PUT', body: data }),

  delete: (id: number) =>
    apiFetch<{ message: string }>(`/paquetes/${id}`, { method: 'DELETE' }),
};