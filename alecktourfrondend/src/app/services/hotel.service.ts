import { apiFetch } from '../api/v1/api';

export interface CaracteristicaResponse {
  id_caracteristica: number;
  nombre_caracteristica: string;
}

export interface HotelCaracteristicaResponse {
  id_hotel: number;
  id_caracteristica: number;
  disponible: boolean;
  caracteristica?: CaracteristicaResponse;
}

export interface TipoHabitacionResponse {
  id_tipo_habitacion: number;
  nombre_tipo: string;
  descripcion?: string;
  capacidad_personas: number;
}

export interface HabitacionResponse {
  id_habitacion: number;
  id_hotel: number;
  id_tipo_habitacion: number;
  numero_habitacion: string;
  precio_noche: number;
  estado: string;
  tipo_habitacion?: TipoHabitacionResponse;
}

export interface HotelResponse {
  id_hotel: number;
  nombre_hotel: string;
  calificacion: number;
  ciudad: string;
  pais: string;
  direccion?: string;
  codigo_postal?: string;
  correo_electronico: string;
  telefono: string;
  // Reseñas reales de clientes (calculadas en el backend desde la tabla
  // `resenas`) — total_resenas siempre viene, calificacion_promedio es
  // null si el hotel todavía no tiene ninguna reseña real.
  total_resenas: number;
  calificacion_promedio: number | null;
}

export interface HotelDetailResponse extends HotelResponse {
  habitaciones: HabitacionResponse[];
  hotel_caracteristicas: HotelCaracteristicaResponse[];
}

export const hotelService = {
  // El backend ya responde con HotelDetailResponse (incluye habitaciones y
  // hotel_caracteristicas) también en el listado, no solo en el detalle —
  // el tipo aquí reflejaba solo un subconjunto y forzaba casts `as any`
  // en SearchResults.tsx/HotelCard.tsx para leer esos campos.
  //
  // fechaCheckin/fechaCheckout son opcionales (FASE G): cuando se mandan,
  // el backend filtra a hoteles con disponibilidad real para esas fechas
  // (ver GET /hoteles/ en hotel_route.py) — antes el buscador las capturaba
  // pero nunca las enviaba, así que nunca filtraban nada de verdad.
  getAll: (skip = 0, limit = 50, opts?: { fechaCheckin?: string; fechaCheckout?: string }) => {
    const params = new URLSearchParams({ skip: String(skip), limit: String(limit) });
    if (opts?.fechaCheckin && opts?.fechaCheckout) {
      params.set('fecha_checkin', opts.fechaCheckin);
      params.set('fecha_checkout', opts.fechaCheckout);
    }
    return apiFetch<HotelDetailResponse[]>(`/hoteles/?${params.toString()}`);
  },

  getById: (id: number) =>
    apiFetch<HotelDetailResponse>(`/hoteles/${id}`),

  create: (data: Partial<HotelResponse>) =>
    apiFetch<HotelResponse>('/hoteles/', { method: 'POST', body: data }),

  update: (id: number, data: Partial<HotelResponse>) =>
    apiFetch<HotelResponse>(`/hoteles/${id}`, { method: 'PUT', body: data }),

  delete: (id: number) =>
    apiFetch<{ message: string }>(`/hoteles/${id}`, { method: 'DELETE' }),
};