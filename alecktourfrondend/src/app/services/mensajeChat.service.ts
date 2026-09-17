import { apiFetch } from "../api/v1/api";

// Espejo de MensajeChatResponse (backend/app/schemas/mensaje_chat_schema.py).
export interface MensajeChat {
  id_mensaje: number;
  id_cliente: number;
  id_usuario_remitente: number;
  remitente_tipo: "admin" | "cliente";
  contenido: string | null;
  imagen_url: string | null;
  leido: boolean;
  fecha_envio: string | null;
  // Denormalizados por el backend (MensajeChatRepository) para no tener
  // que resolver el nombre/foto del remitente aparte en el frontend.
  remitente_nombre: string | null;
  remitente_foto: string | null;
}

// Espejo de HiloResumenResponse -- una fila por cliente en la bandeja
// compartida del admin (ModuleMensajes.tsx). No existe una tabla de
// "hilo": esto se deriva agregando mensajes_chat por id_cliente.
export interface HiloResumen {
  id_cliente: number;
  cliente_nombre: string;
  cliente_foto: string | null;
  ultimo_mensaje: string | null;
  ultimo_mensaje_fecha: string | null;
  no_leidos: number;
}

function construirFormData(contenido?: string, imagen?: File): FormData {
  const fd = new FormData();
  if (contenido) fd.append("contenido", contenido);
  if (imagen) fd.append("imagen", imagen);
  return fd;
}

// Chat privado admin<->cliente (con capturas vía Cloudinary) -- un solo
// hilo continuo por cliente, bandeja compartida (cualquier admin ve y
// responde cualquier hilo). Solo polling, sin websockets (ver el
// comentario de mensaje_chat_route.py: el backend está en el plan free de
// Render, que duerme tras 15 min de inactividad y mataría cualquier
// socket abierto) -- por eso getHilo/getMiHilo aceptan `afterId` para
// pedir solo los mensajes nuevos en cada ciclo, en vez de recargar todo
// el hilo.
export const mensajeChatService = {
  // ── Admin (bandeja compartida) ──────────────────────────────────────
  getHilos: () => apiFetch<HiloResumen[]>("/mensajes/hilos"),

  getHilo: (idCliente: number, afterId?: number) =>
    apiFetch<MensajeChat[]>(
      `/mensajes/hilos/${idCliente}${afterId != null ? `?after_id=${afterId}` : ""}`,
    ),

  enviarComoAdmin: (idCliente: number, contenido?: string, imagen?: File) => {
    const fd = construirFormData(contenido, imagen);
    fd.append("id_cliente", String(idCliente));
    return apiFetch<MensajeChat>("/mensajes/enviar", { method: "POST", body: fd });
  },

  // ── Cliente (su propio hilo) ─────────────────────────────────────────
  getMiHilo: (afterId?: number) =>
    apiFetch<MensajeChat[]>(`/mensajes/me${afterId != null ? `?after_id=${afterId}` : ""}`),

  enviarComoCliente: (contenido?: string, imagen?: File) =>
    apiFetch<MensajeChat>("/mensajes/me/enviar", {
      method: "POST",
      body: construirFormData(contenido, imagen),
    }),

  // ── Compartidos por ambos roles ──────────────────────────────────────
  // idCliente: lo pasa el admin (indica de qué hilo); el cliente lo omite
  // -- su propio hilo se resuelve del token en el backend, nunca de un
  // parámetro.
  marcarLeido: (idCliente?: number) =>
    apiFetch<{ actualizados: number }>("/mensajes/leido", {
      method: "PATCH",
      body: idCliente != null ? { id_cliente: idCliente } : {},
    }),

  getNoLeidos: () => apiFetch<{ no_leidos: number }>("/mensajes/no-leidos"),
};
