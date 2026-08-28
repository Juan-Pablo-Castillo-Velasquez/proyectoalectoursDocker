import { apiFetch } from "../api/v1/api";

// Ver SolicitudCorporativa en backend/app/models/empresa_model.py — cada
// fila es un envío real del formulario "Solicita una cotización" de
// /corporate (Corporate.tsx).
export interface SolicitudCorporativa {
  id_solicitud: number;
  nombre_empresa: string;
  numero_empleados: string | null;
  nombre_contacto: string;
  email_corporativo: string;
  telefono: string;
  mensaje: string | null;
  estado: "nuevo" | "contactado" | "cerrado" | "descartado";
  fecha_creacion: string;
}

export interface SolicitudCorporativaCreateInput {
  nombre_empresa: string;
  numero_empleados?: string;
  nombre_contacto: string;
  email_corporativo: string;
  telefono: string;
  mensaje?: string;
}

export const empresaService = {
  // Pública — la usa el formulario de /corporate, sin autenticación.
  crear: (data: SolicitudCorporativaCreateInput) =>
    apiFetch<SolicitudCorporativa>("/solicitudes-corporativas", { method: "POST", body: data }),
  // limit=300 es el máximo real que acepta el backend (Query(..., le=300)
  // en empresa_route.py) — se pide explícito en vez del default de 100
  // para que, pasadas las 100 solicitudes históricas, las más antiguas sin
  // atender no queden fuera silenciosamente.
  getAll: (estado?: string) =>
    apiFetch<SolicitudCorporativa[]>(`/solicitudes-corporativas?limit=300${estado ? `&estado=${estado}` : ""}`),
  actualizarEstado: (id: number, estado: SolicitudCorporativa["estado"]) =>
    apiFetch<SolicitudCorporativa>(`/solicitudes-corporativas/${id}`, { method: "PUT", body: { estado } }),
  delete: (id: number) =>
    apiFetch<{ message: string }>(`/solicitudes-corporativas/${id}`, { method: "DELETE" }),
};
