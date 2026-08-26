import { apiFetch } from '../api/v1/api';

export interface ClienteResponse {
  id_cliente: number;
  nombre: string;
  apellido: string;
  cedula: string;
  correo: string;
  celular: string;
  direccion: string;
  ciudad: string;
  pais: string;
  fecha_nacimiento: string;
}

export const clienteService = {
  getById: (id: number) =>
    apiFetch<ClienteResponse>(`/clientes/${id}`),
  create: (data: Partial<ClienteResponse>) =>
    apiFetch<ClienteResponse>('/clientes', { method: 'POST', body: data }),
  update: (id: number, data: Partial<ClienteResponse>) =>
    apiFetch<ClienteResponse>(`/clientes/${id}`, { method: 'PUT', body: data }),
  cambiarContrasena: (id: number, data: { contrasena_actual: string; nueva_contrasena: string }) =>
    apiFetch<{ message: string }>(`/clientes/${id}/cambiar-contrasena`, { method: 'PUT', body: data }),
};