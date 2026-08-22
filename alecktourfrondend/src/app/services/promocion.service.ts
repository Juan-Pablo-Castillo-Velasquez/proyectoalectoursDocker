import { apiFetch } from '../api/v1/api';

export interface OfertaDestacada {
  title: string;
  tag: string;
  discount: string;
  price: string;
  oldPrice: string;
  img: string;
}

export const promocionService = {
  getDestacados: () =>
    apiFetch<OfertaDestacada[]>('/promociones/destacados'),
};