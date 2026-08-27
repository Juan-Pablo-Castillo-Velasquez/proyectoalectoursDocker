import { apiFetch } from "../api/v1/api";

// Ver ConfiguracionSistema en backend/app/models/configuracion_model.py —
// almacén clave/valor centralizado para parámetros del admin. No todas las
// claves controlan todavía una funcionalidad real: cada una se conecta a
// comportamiento del sitio a medida que esa parte se construye.
export interface ConfiguracionItem {
  id_config: number;
  clave: string;
  valor: string | null;
  descripcion: string | null;
  actualizado_en: string | null;
}

export interface ConfiguracionCreateInput {
  clave: string;
  valor?: string;
  descripcion?: string;
}

export interface ConfiguracionUpdateInput {
  valor?: string;
  descripcion?: string;
}

export const configuracionService = {
  getAll: () => apiFetch<ConfiguracionItem[]>("/configuracion"),
  create: (data: ConfiguracionCreateInput) =>
    apiFetch<ConfiguracionItem>("/configuracion", { method: "POST", body: data }),
  update: (id: number, data: ConfiguracionUpdateInput) =>
    apiFetch<ConfiguracionItem>(`/configuracion/${id}`, { method: "PUT", body: data }),
  delete: (id: number) =>
    apiFetch<{ message: string }>(`/configuracion/${id}`, { method: "DELETE" }),
};
