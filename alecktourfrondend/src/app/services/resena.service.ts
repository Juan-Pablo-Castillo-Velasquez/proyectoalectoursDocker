import { apiFetch } from "../api/v1/api";

export interface ResenaCreate {
  id_reserva: number;
  calificacion: number;
  comentario: string;
  foto_url?: string;
}

export interface ResenaResponse {
  id_resena: number;
  id_reserva: number;
  id_hotel: number;
  calificacion: number;
  comentario: string;
  foto_url?: string;
  fecha_creacion: string;
  nombre_cliente?: string;
}

export const resenaService = {
  crear: (data: ResenaCreate) =>
    apiFetch<ResenaResponse>("/resenas", { method: "POST", body: data }),
  getByHotel: (idHotel: number) =>
    apiFetch<ResenaResponse[]>(`/resenas/hotel/${idHotel}`),
};
