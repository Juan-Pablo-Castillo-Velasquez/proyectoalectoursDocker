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
  // El backend ya lo devuelve (Cliente.fecha_registro, ver ClienteResponse
  // en cliente_schema.py) -- solo faltaba declararlo aquí. Lo usa Profile.tsx
  // para decidir si la cuenta es "nueva" (creada después del corte en que se
  // volvió obligatorio guardar un método de pago) o una cuenta previa, que
  // nunca queda bloqueada retroactivamente.
  fecha_registro?: string | null;
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