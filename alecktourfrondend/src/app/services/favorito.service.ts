import { apiFetch } from '../api/v1/api';
import { HotelDetailResponse } from './hotel.service';

export interface FavoritoResponse {
  id_favorito: number;
  id_hotel: number;
  fecha_creacion: string | null;
  hotel: HotelDetailResponse | null;
}

// Requiere sesión iniciada (Authorization: Bearer, igual que resenaService).
// El backend valida que el usuario autenticado tenga perfil de cliente.
export const favoritoService = {
  listar: () => apiFetch<FavoritoResponse[]>('/favoritos'),

  listarIds: () => apiFetch<number[]>('/favoritos/ids'),

  agregar: (idHotel: number) =>
    apiFetch<FavoritoResponse>('/favoritos', {
      method: 'POST',
      body: { id_hotel: idHotel },
    }),

  quitar: (idHotel: number) =>
    apiFetch<void>(`/favoritos/${idHotel}`, { method: 'DELETE' }),
};
