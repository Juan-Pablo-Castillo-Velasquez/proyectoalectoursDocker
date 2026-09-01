import { apiFetch } from '../api/v1/api';

// Mismos códigos que reserva.service.ts (CodigoMetodoPago) — se reutiliza la
// misma taxonomía de tipos de pago que ya usa el flujo de checkout real.
export type TipoMetodoPagoGuardado =
  | 'tarjeta_credito'
  | 'tarjeta_debito'
  | 'pse'
  | 'nequi'
  | 'paypal'
  | 'otro';

export interface MetodoPagoGuardado {
  id_metodo_guardado: number;
  alias: string;
  tipo: string;
  ultimos4: string | null;
  predeterminado: boolean;
  fecha_creacion: string | null;
}

export interface MetodoPagoGuardadoCreate {
  alias: string;
  tipo: string;
  ultimos4?: string;
  // PIN de confirmación (4 a 6 dígitos) — el backend lo guarda con hash
  // bcrypt, nunca en texto plano (ver metodo_pago_guardado_model.py).
  clave: string;
  predeterminado?: boolean;
}

// Edición vía lápiz del perfil: todos los campos son opcionales; `clave` solo
// se re-hashea si el cliente decide cambiarla (si se omite, se conserva).
export interface MetodoPagoGuardadoUpdate {
  alias?: string;
  tipo?: string;
  ultimos4?: string;
  clave?: string;
  predeterminado?: boolean;
}

export const metodoPagoGuardadoService = {
  getAll: () =>
    apiFetch<MetodoPagoGuardado[]>('/metodos-pago-guardados'),

  create: (data: MetodoPagoGuardadoCreate) =>
    apiFetch<MetodoPagoGuardado>('/metodos-pago-guardados', { method: 'POST', body: data }),

  update: (id: number, data: MetodoPagoGuardadoUpdate) =>
    apiFetch<MetodoPagoGuardado>(`/metodos-pago-guardados/${id}`, { method: 'PUT', body: data }),

  verificarClave: (id: number, clave: string) =>
    apiFetch<{ valido: boolean }>(`/metodos-pago-guardados/${id}/verificar`, {
      method: 'POST',
      body: { clave },
    }),

  delete: (id: number) =>
    apiFetch<void>(`/metodos-pago-guardados/${id}`, { method: 'DELETE' }),
};
