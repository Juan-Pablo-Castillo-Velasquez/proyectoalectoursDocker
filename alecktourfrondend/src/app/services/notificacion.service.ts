import { apiFetch } from "../api/v1/api";

// Ver Notificacion en backend/app/models/notificacion_model.py — cada fila
// es un evento real (nueva cancelación, mensaje de contacto, solicitud
// corporativa, pago aprobado), creada en el momento exacto en que ocurre.
export interface NotificacionItem {
  id_notificacion: number;
  tipo: "contacto" | "cancelacion" | "corporativo" | "pago" | string;
  titulo: string;
  mensaje: string | null;
  id_referencia: number | null;
  leido: boolean;
  fecha_creacion: string;
}

export const notificacionService = {
  getAll: (soloNoLeidas = false, limit = 50) =>
    apiFetch<NotificacionItem[]>(`/notificaciones?solo_no_leidas=${soloNoLeidas}&limit=${limit}`),
  contarNoLeidas: () =>
    apiFetch<{ total: number }>("/notificaciones/no-leidas/conteo"),
  marcarLeida: (id: number) =>
    apiFetch<NotificacionItem>(`/notificaciones/${id}/leer`, { method: "PUT" }),
  marcarTodasLeidas: () =>
    apiFetch<{ message: string }>("/notificaciones/leer-todas", { method: "PUT" }),
  delete: (id: number) =>
    apiFetch<{ message: string }>(`/notificaciones/${id}`, { method: "DELETE" }),
};
