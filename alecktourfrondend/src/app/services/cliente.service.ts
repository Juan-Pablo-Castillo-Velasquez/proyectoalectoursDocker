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

export interface MetodoPagoGuardadoAdminResponse {
  id_metodo_guardado: number;
  alias: string;
  tipo: string;
  ultimos4: string | null;
  predeterminado: boolean;
  fecha_creacion: string | null;
}

export const clienteService = {
  getById: (id: number) =>
    apiFetch<ClienteResponse>(`/clientes/${id}`),
  // Nunca expone la clave (va hasheada en el backend) ni ningún dato
  // sensible real — solo alias/tipo/últimos4, igual que ve el propio
  // cliente. Antes este listado solo existía en el endpoint self-service.
  getMetodosPago: (id: number) =>
    apiFetch<MetodoPagoGuardadoAdminResponse[]>(`/clientes/${id}/metodos-pago`),
  create: (data: Partial<ClienteResponse>) =>
    apiFetch<ClienteResponse>('/clientes', { method: 'POST', body: data }),
  update: (id: number, data: Partial<ClienteResponse>) =>
    apiFetch<ClienteResponse>(`/clientes/${id}`, { method: 'PUT', body: data }),
  cambiarContrasena: (id: number, data: { contrasena_actual: string; nueva_contrasena: string }) =>
    apiFetch<{ message: string }>(`/clientes/${id}/cambiar-contrasena`, { method: 'PUT', body: data }),
};