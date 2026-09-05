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
  // URL real (Cloudinary o ruta relativa /uploads/temas-video/...) de un
  // video para el fondo del Hero cuando este tema está activo -- null si
  // el tema usa el video genérico de por defecto (ver Hero.tsx).
  video_url: string | null;
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

// Mismo criterio que resolveImagenTema, para `Tema.video_url`.
export function resolveVideoTema(video_url: string): string {
  return video_url.startsWith("http") ? video_url : `${BASE_URL}${video_url}`;
}

export const temaService = {
  // Público — usado por TemaProvider en el arranque de la app.
  getActivo: () => apiFetch<Tema>("/temas/activo"),

  // Galería dinámica de Cloudinary de la temporada `clave` (ver
  // backend/app/routes/tema_route.py::get_galeria_tema) -- a diferencia de
  // imagen_url/video_url (un solo archivo subido desde ModuleTemas.tsx),
  // esta lista la gestiona quien tenga acceso a la cuenta de Cloudinary
  // subiendo/borrando archivos directo ahí, sin tocar código ni redeploy.
  // Lista de URLs https:// listas para usar en <img src>, nunca falla
  // (el backend devuelve [] si Cloudinary no está configurado o la
  // carpeta está vacía) — ver useTemaGaleria.ts para el hook que la
  // consume con manejo de loading.
  getGaleria: (clave: string, limite = 12) =>
    apiFetch<string[]>(`/temas/${clave}/galeria?limite=${limite}`),

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

  // Video decorativo del Hero (opcional) -- mismo mecanismo que la imagen,
  // Cloudinary si está configurado.
  subirVideo: (id: number, video: File) => {
    const fd = new FormData();
    fd.append("video", video);
    return apiFetch<Tema>(`/temas/${id}/video`, { method: "POST", body: fd });
  },

  borrarVideo: (id: number) =>
    apiFetch<Tema>(`/temas/${id}/video`, { method: "DELETE" }),
};
