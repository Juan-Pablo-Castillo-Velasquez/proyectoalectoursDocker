import { apiFetch } from '../api/v1/api';

export interface UsuarioResponse {
  id_usuario: number;
  username: string;
  correo_electronico: string;
  foto_perfil: string | null;
  id_cliente: number | null;
  id_empleado: number | null;
}

export const usuarioService = {
  getMe: () =>
    apiFetch<UsuarioResponse>('/usuarios/me'),

  uploadFoto: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiFetch<UsuarioResponse>('/usuarios/me/foto', {
      method: 'POST',
      body: formData,
    });
  },

  deleteFoto: () =>
    apiFetch<UsuarioResponse>('/usuarios/me/foto', { method: 'DELETE' }),

  cambiarPassword: (data: { contrasena_actual: string; nueva_contrasena: string }) =>
    apiFetch<{ message: string }>('/usuarios/me/password', {
      method: 'PUT',
      body: data,
    }),
};
