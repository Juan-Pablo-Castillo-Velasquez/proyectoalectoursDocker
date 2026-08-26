import { apiFetch } from '../api/v1/api';

export interface ServicioResponse {
    id_servicio: number;
    nombre_servicio: string;
    descripcion: string | null;
    id_categoria: number | null;
    id_destino: number | null;
    duracion_horas: number | null;
    precio_base: number;
    capacidad_maxima: number;
}

export interface CategoriaServicioResponse {
    id_categoria: number;
    nombre_categoria: string;
}

export type ServicioInput = Partial<Omit<ServicioResponse, 'id_servicio'>>;

export const servicioService = {
    getAll: (params?: { id_destino?: number; id_categoria?: number; skip?: number; limit?: number }) => {
        const query = new URLSearchParams();
        if (params?.id_destino != null) query.set('id_destino', String(params.id_destino));
        if (params?.id_categoria != null) query.set('id_categoria', String(params.id_categoria));
        if (params?.skip != null) query.set('skip', String(params.skip));
        if (params?.limit != null) query.set('limit', String(params.limit));
        const qs = query.toString();
        return apiFetch<ServicioResponse[]>(`/servicios/${qs ? `?${qs}` : ''}`);
    },

    getByDestino: (idDestino: number) =>
        apiFetch<ServicioResponse[]>(`/servicios/?id_destino=${idDestino}`),

    getById: (id: number) =>
        apiFetch<ServicioResponse>(`/servicios/${id}`),

    getCategorias: () =>
        apiFetch<CategoriaServicioResponse[]>('/servicios/categorias'),

    create: (data: ServicioInput) =>
        apiFetch<ServicioResponse>('/servicios/', { method: 'POST', body: data }),

    update: (id: number, data: ServicioInput) =>
        apiFetch<ServicioResponse>(`/servicios/${id}`, { method: 'PUT', body: data }),

    delete: (id: number) =>
        apiFetch<{ message: string }>(`/servicios/${id}`, { method: 'DELETE' }),
};
