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

export const destinoService = {
    getSeleccionCasa: () =>
        apiFetch<DestinoSeleccion[]>('/promociones/seleccion-casa'),
};