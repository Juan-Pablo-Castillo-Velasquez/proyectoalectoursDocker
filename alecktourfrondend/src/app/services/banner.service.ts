import { apiFetch, BASE_URL } from "../api/v1/api";

// Espejo de BannerResponse (backend/app/schemas/banner_schema.py).
export interface Banner {
  id_banner: number;
  titulo: string;
  descripcion_corta: string | null;
  imagen_url: string;
  texto_boton: string | null;
  link_destino: string | null;
  fecha_inicio: string | null; // "2026-08-20"
  fecha_fin: string | null;
  // Clave del tema de temporada al que pertenece (ej. "halloween") -- null
  // significa "vigente todo el año", sin importar qué tema esté activo.
  // Ver Tema.clave en tema.service.ts.
  temporada: string | null;
  orden: number;
  activo: boolean;
  fecha_creacion: string | null;
}

export interface BannerFormData {
  titulo: string;
  descripcion_corta?: string;
  texto_boton?: string;
  link_destino?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  /** Clave de un tema (Tema.clave) para que el banner solo se muestre
   * mientras ese tema esté activo -- vacío/omitido = todo el año. */
  temporada?: string;
  activo: boolean;
  /** Solo requerida al crear — al editar, si se omite se conserva la imagen actual. */
  imagen?: File;
}

// `Banner.imagen_url` llega como ruta relativa ("/uploads/banners/xxx.jpg")
// — igual que Usuario.foto_perfil (ver resolveFotoUrl en components/admin/types.ts).
export function resolveImagenBanner(imagen_url: string): string {
  return imagen_url.startsWith("http") ? imagen_url : `${BASE_URL}${imagen_url}`;
}

function construirFormData(data: BannerFormData): FormData {
  const fd = new FormData();
  fd.append("titulo", data.titulo);
  if (data.descripcion_corta) fd.append("descripcion_corta", data.descripcion_corta);
  if (data.texto_boton) fd.append("texto_boton", data.texto_boton);
  if (data.link_destino) fd.append("link_destino", data.link_destino);
  if (data.fecha_inicio) fd.append("fecha_inicio", data.fecha_inicio);
  if (data.fecha_fin) fd.append("fecha_fin", data.fecha_fin);
  if (data.temporada) fd.append("temporada", data.temporada);
  fd.append("activo", String(data.activo));
  if (data.imagen) fd.append("imagen", data.imagen);
  return fd;
}

export const bannerService = {
  // Público — home (BannersPromocionales.tsx)
  getActivos: () => apiFetch<Banner[]>("/banners/activos"),

  // Admin (ModuleBanners.tsx)
  getAll: () => apiFetch<Banner[]>("/banners/"),

  create: (data: BannerFormData) =>
    apiFetch<Banner>("/banners/", { method: "POST", body: construirFormData(data) }),

  update: (id: number, data: BannerFormData) =>
    apiFetch<Banner>(`/banners/${id}`, { method: "PUT", body: construirFormData(data) }),

  reordenar: (items: { id_banner: number; orden: number }[]) =>
    apiFetch<Banner[]>("/banners/reordenar", { method: "PUT", body: items }),

  toggleActivo: (id: number, activo: boolean) =>
    apiFetch<Banner>(`/banners/${id}/activo`, { method: "PATCH", body: { activo } }),

  delete: (id: number) =>
    apiFetch<{ message: string }>(`/banners/${id}`, { method: "DELETE" }),
};
