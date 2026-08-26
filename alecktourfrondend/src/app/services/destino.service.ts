import { apiFetch } from '../api/v1/api';

export interface DestinoSeleccion {
    id: number;
    name: string;
    tag: string;
    img: string;
    rating: number;
    price: string;
    nights: string;
}

export interface DestinoSugerencia {
    id_destino: number;
    nombre_destino: string;
    ciudad: string | null;
    pais: string | null;
}

export interface DestinoResponse {
    id_destino: number;
    nombre_destino: string;
    descripcion: string | null;
    ciudad: string | null;
    pais: string | null;
    temporada_alta_inicio: string | null;
    temporada_alta_fin: string | null;
}

export type DestinoInput = Partial<Omit<DestinoResponse, 'id_destino'>>;

export const destinoService = {
    getSeleccionCasa: () =>
        apiFetch<DestinoSeleccion[]>('/promociones/seleccion-casa'),

    getSugerencias: (q = '', limit = 8) =>
        apiFetch<DestinoSugerencia[]>(`/destinos/sugerencias?q=${encodeURIComponent(q)}&limit=${limit}`),

    getAll: (q = '', skip = 0, limit = 20) =>
        apiFetch<DestinoResponse[]>(`/destinos/?q=${encodeURIComponent(q)}&skip=${skip}&limit=${limit}`),

    getById: (id: number) =>
        apiFetch<DestinoResponse>(`/destinos/${id}`),

    create: (data: DestinoInput) =>
        apiFetch<DestinoResponse>('/destinos/', { method: 'POST', body: data }),

    update: (id: number, data: DestinoInput) =>
        apiFetch<DestinoResponse>(`/destinos/${id}`, { method: 'PUT', body: data }),

    delete: (id: number) =>
        apiFetch<{ message: string }>(`/destinos/${id}`, { method: 'DELETE' }),
};
