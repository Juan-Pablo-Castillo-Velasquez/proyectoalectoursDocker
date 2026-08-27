import { apiFetch } from '../api/v1/api';

export interface UsuarioAdminResponse {
  id_usuario: number;
  username: string;
  correo_electronico: string;
  activo: boolean;
  verificado: boolean;
  nombre_completo: string | null;
  roles: string[];
  // Real (ver _shape_usuario_admin en usuario_route.py) — para mostrar la
  // foto real del usuario en el listado de Usuarios del admin.
  foto_perfil?: string | null;
}

export interface RolResponse {
  id_rol: number;
  nombre_rol: string;
}

export const usuarioAdminService = {
  getAll: () =>
    apiFetch<UsuarioAdminResponse[]>('/usuarios'),
  create: (data: { username: string; correo_electronico: string; password: string; roles: string[] }) =>
    apiFetch<UsuarioAdminResponse>('/usuarios', { method: 'POST', body: data }),
  update: (id: number, data: { activo?: boolean; verificado?: boolean; roles?: string[] }) =>
    apiFetch<UsuarioAdminResponse>(`/usuarios/${id}`, { method: 'PUT', body: data }),
  delete: (id: number) =>
    apiFetch<{ message: string }>(`/usuarios/${id}`, { method: 'DELETE' }),
  getRoles: () =>
    apiFetch<RolResponse[]>('/roles'),
};
