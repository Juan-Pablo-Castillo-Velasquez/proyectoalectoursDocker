import { apiFetch } from '../api/v1/api';
import type { HotelDetailResponse } from './hotel.service';

export interface PreferenciaResponse {
  id_preferencia: number;
  id_cliente: number;
  intereses: string[];
  compania: string;
  presupuesto: string;
  clima: string;
  ritmo: string;
  transporte: string;
}

export interface PaqueteSugerido {
  id_paquete: number;
  nombre_paquete: string;
  descripcion: string | null;
  duracion_dias: number | null;
  precio_base: number;
  activo: boolean;
  destinos: string[];
  hoteles: string[];
}

export const preferenciasService = {
  getByCliente: (id: number) =>
    apiFetch<PreferenciaResponse>(`/preferencias-cliente/${id}`),

  getSugerencias: (id: number, limit = 6) =>
    apiFetch<PaqueteSugerido[]>(`/preferencias-cliente/${id}/sugerencias?limit=${limit}`),

  // Hoteles sugeridos según las preferencias — el bloque del perfil muestra
  // tarjetas de hotel (HotelCard → /hotel/{id}) en lugar de paquetes.
  getSugerenciasHoteles: (id: number, limit = 6) =>
    apiFetch<HotelDetailResponse[]>(`/preferencias-cliente/${id}/sugerencias-hoteles?limit=${limit}`),

  save: (id_cliente: number | string, data: any) =>
    apiFetch<PreferenciaResponse>('/preferencias-cliente/', { 
      method: 'POST', 
      body: {
        id_cliente,
        intereses: data.interests,
        compania: data.company,
        presupuesto: data.budget,
        clima: data.weather,
        ritmo: data.pace,
        transporte: data.transport,
      }
    }),
  
  // Alias para compatibilidad
  savePreferences: (id_cliente: number | string, data: any) =>
    apiFetch<PreferenciaResponse>('/preferencias-cliente/', { 
      method: 'POST', 
      body: {
        id_cliente,
        intereses: data.interests,
        compania: data.company,
        presupuesto: data.budget,
        clima: data.weather,
        ritmo: data.pace,
        transporte: data.transport,
      }
    }),
};