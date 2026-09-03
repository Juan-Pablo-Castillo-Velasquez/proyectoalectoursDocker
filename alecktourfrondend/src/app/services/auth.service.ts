// En producción, VITE_API_BASE_URL debe apuntar al backend real (variable de
// entorno en Vercel/hosting). Sin la variable definida (dev local), usa
// localhost como siempre — mismo criterio que src/app/api/v1/api.ts.
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export interface UsuarioCreate {
  username: string;
  correo_electronico: string;
  password: string;
}

export interface UsuarioLogin {
  username: string;
  password: string;
}

export interface RegisterResponse {
  message: string;
  user_id: number;
  email: string;
  verification_token: string;
  access_token?: string;
  token_type?: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user_id?: number;
  username?: string;
  id_cliente?: number;
  roles?: string[];
  // El backend ya lo devuelve (ver login_user en auth_service.py) — faltaba
  // declararlo aquí, así que LoginModal.tsx/Login.tsx nunca lo leían y la
  // foto de perfil desaparecía de la sesión con cada login nuevo, aunque
  // siguiera guardada en la base de datos.
  foto_perfil?: string | null;
}

async function authFetch<T>(endpoint: string, body: object): Promise<T> {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = Array.isArray(err.detail)
      ? err.detail.map((d: any) => d.msg).join(', ')
      : err.detail || 'Error en la autenticación';
    throw new Error(msg);
  }

  return response.json();
}

export const authService = {
  register: (data: UsuarioCreate) =>
    authFetch<RegisterResponse>('/auth/register', data),

  login: (data: UsuarioLogin) =>
    authFetch<AuthResponse>('/auth/login', data),

  verifyEmail: async (token: string) => {
    const response = await fetch(
      `${BASE_URL}/auth/verify-email?token=${encodeURIComponent(token)}`,
      { method: 'POST', headers: { 'accept': 'application/json' } }
    );
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || 'Error al verificar email');
    }
    return response.json();
  },

  // ✅ Estos van DENTRO del objeto
  forgotPassword: (correo_electronico: string) =>
    authFetch<{ message: string }>('/auth/forgot-password', { correo_electronico }),

  resetPassword: (token: string, new_password: string) =>
    authFetch<{ message: string }>('/auth/reset-password', { token, new_password }),
};