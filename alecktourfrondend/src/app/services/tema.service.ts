import { apiFetch, BASE_URL } from "../api/v1/api";

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
  // Nombre de ícono decorativo (catálogo cerrado, ver temaIconos.tsx) --
  // null en temas sin ícono elegido, nunca rompe el render (fallback a
  // Sparkles vía getTemaIcono()).
  icono: string | null;
  // URL real (Cloudinary o ruta relativa /uploads/temas/...) de una imagen
  // decorativa subida por el admin -- null si el tema solo usa su ícono.
  imagen_url: string | null;
  fecha_creacion: string | null;
}

export interface TemaFormData {
  nombre: string;
  color_primario_claro: string;
  color_primario_oscuro: string;
  color_secundario_claro: string;
  color_secundario_oscuro: string;
  icono: string | null;
}

// `Tema.imagen_url` llega como ruta relativa o URL absoluta de Cloudinary
// -- mismo criterio que resolveImagenBanner en banner.service.ts.
export function resolveImagenTema(imagen_url: string): string {
  return imagen_url.startsWith("http") ? imagen_url : `${BASE_URL}${imagen_url}`;
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

  // Imagen decorativa real (opcional) -- Cloudinary si está configurado.
  subirImagen: (id: number, imagen: File) => {
    const fd = new FormData();
    fd.append("imagen", imagen);
    return apiFetch<Tema>(`/temas/${id}/imagen`, { method: "POST", body: fd });
  },

  borrarImagen: (id: number) =>
    apiFetch<Tema>(`/temas/${id}/imagen`, { method: "DELETE" }),
};
