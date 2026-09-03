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
  // Ciudad de SALIDA del viaje (vuelo/transporte incluido) — distinta de la
  // ciudad de destino, que se deriva de los hoteles reales vinculados
  // (ver PaqueteDetalleResponse.hoteles[].ciudad).
  ciudad_salida?: string | null;
  // Calculada en el backend (primer hotel vinculado) — null si el paquete
  // todavía no tiene ningún hotel real asociado.
  ciudad_destino?: string | null;
}

export interface PaqueteHotelDetalle {
  id_hotel: number;
  nombre_hotel: string;
  ciudad: string | null;
  pais: string | null;
  calificacion: number | null;
  noches_incluidas: number | null;
  caracteristicas: string[];
  // Foto real del hotel (Hotel.imagen_url) -- antes la ficha de paquete no
  // la pedía y usaba una foto genérica por ciudad en su lugar.
  imagen_url: string | null;
}

export interface PaqueteServicioDetalle {
  id_servicio: number;
  nombre_servicio: string;
  categoria: string | null;
  descripcion: string | null;
  dia_actividad: number | null;
  incluido: boolean;
  capacidad_maxima: number | null;
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