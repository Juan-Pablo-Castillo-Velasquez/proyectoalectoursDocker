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

  // Requiere sesión iniciada (Authorization: Bearer) — el backend valida
  // que cliente_id sea el del cliente autenticado.
  getActividadCliente: (clienteId: number, limit = 30) =>
    apiFetch<ActividadClienteItem[]>(`/clientes/${clienteId}/actividad?limit=${limit}`),
};


// ── Actividad del cliente autenticado (campana del sitio público) ──
// A diferencia de NotificacionItem (100% interna del admin), esto no es
// una fila persistida: el backend la arma al vuelo agregando
// historial_reservas y solicitudes_cancelacion de ESE cliente. Ver
// GET /clientes/{cliente_id}/actividad en solicitud_cancelacion_route.py.
export interface ActividadClienteItem {
  tipo: "reserva" | "cancelacion" | string;
  titulo: string;
  mensaje: string | null;
  fecha: string;
  id_referencia: number;
}
