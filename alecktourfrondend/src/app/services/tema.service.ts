import { apiFetch } from "../api/v1/api";

// Espejo de TemaResponse (backend/app/schemas/tema_schema.py).
export interface Tema {
  id_tema: number;
  nombre: string;
  clave: string;
  color_primario_claro: string;
  color_primario_oscuro: string;
  color_secundario_claro: string;
  color_secundario_oscuro: string;
  activo: boolean;
  es_predeterminado: boolean;
  fecha_creacion: string | null;
}

export interface TemaFormData {
  nombre: string;
  color_primario_claro: string;
  color_primario_oscuro: string;
  color_secundario_claro: string;
  color_secundario_oscuro: string;
}

export const temaService = {
  // Público — usado por TemaProvider en el arranque de la app.
  getActivo: () => apiFetch<Tema>("/temas/activo"),

  // Admin (ModuleTemas.tsx)
  getAll: () => apiFetch<Tema[]>("/temas/"),

  create: (data: TemaFormData) =>
    apiFetch<Tema>("/temas/", { method: "POST", body: data }),

  update: (id: number, data: TemaFormData) =>
    apiFetch<Tema>(`/temas/${id}`, { method: "PUT", body: data }),

  activar: (id: number) =>
    apiFetch<Tema>(`/temas/${id}/activar`, { method: "PUT" }),

  delete: (id: number) =>
    apiFetch<{ message: string }>(`/temas/${id}`, { method: "DELETE" }),
};
