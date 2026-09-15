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

// Catálogo fijo de permisos que el backend conoce (ver Permiso en
// auth_model.py / GET /api/permisos) -- agrupado por `categoria` en
// ModuleRoles.tsx para pintar los checkboxes.
export interface PermisoResponse {
  id_permiso: number;
  clave: string;
  nombre: string;
  categoria: string;
}

// Permisos asignados a UN rol en particular (GET/PUT /api/roles/{id}/permisos).
// total_usuarios viaja para que el panel pueda avisar antes de dejar
// eliminar un rol que todavía tiene gente asignada.
export interface RolConPermisosResponse {
  id_rol: number;
  nombre_rol: string;
  permisos: string[];
  total_usuarios: number;
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
  createRol: (nombre_rol: string) =>
    apiFetch<RolResponse>('/roles', { method: 'POST', body: { nombre_rol } }),
  deleteRol: (id: number) =>
    apiFetch<{ message: string }>(`/roles/${id}`, { method: 'DELETE' }),
  getPermisos: () =>
    apiFetch<PermisoResponse[]>('/permisos'),
  getPermisosDeRol: (id: number) =>
    apiFetch<RolConPermisosResponse>(`/roles/${id}/permisos`),
  setPermisosDeRol: (id: number, permisos: string[]) =>
    apiFetch<RolConPermisosResponse>(`/roles/${id}/permisos`, { method: 'PUT', body: { permisos } }),
};
