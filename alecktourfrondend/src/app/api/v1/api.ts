const BASE_URL = "http://localhost:8000";
const API_PREFIX = "/api";

interface FetchOptions extends RequestInit {
  body?: any;
}

// ─── Login (form-encoded, requerido por FastAPI OAuth2) ───────────────────────
export async function apiLogin(username: string, password: string) {
  const body = new URLSearchParams({ username, password });

  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Login fallido");
  }

  const data = await response.json();

  // Guardar token (localStorage: misma fuente que usa AuthContext para persistir sesión)
  if (data.access_token) {
    localStorage.setItem("token", data.access_token);
  }

  return data;
}

// ─── Cliente general para todos los demás endpoints ──────────────────────────
export async function apiFetch<T>(
  endpoint: string,
  options: FetchOptions = {},
): Promise<T> {
  // Prevenir doble prefijo /api (causa 404 con /api/api/...)
  if (endpoint.startsWith("/api/")) {
    console.warn(
      `apiFetch: el endpoint "${endpoint}" ya incluye /api — se eliminó el prefijo duplicado.`,
    );
    endpoint = endpoint.replace(/^\/api/, "");
  }

  // Construir URL: /auth/... no lleva prefijo /api
  const url = endpoint.startsWith("/auth")
    ? `${BASE_URL}${endpoint}`
    : `${BASE_URL}${API_PREFIX}${endpoint}`;

  // Serializar body a JSON si es un objeto
  if (options.body && typeof options.body === "object") {
    options.body = JSON.stringify(options.body);
    options.headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };
  }

  // Agregar token de autorización si existe
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Error en la petición al servidor");
  }

  if (response.status === 204) return {} as T;

  return response.json() as Promise<T>;
}

// ─── Reseñas ───────────────────────────────────────────────────────────────
export interface ResenaDestacada {
  id: number;
  name: string;
  location: string;
  quote: string;
  rating: number;
  trip: string;
  avatar: string;
  fecha?: string;
}

export interface ResenasDestacadasResponse {
  promedio: number;
  total: number;
  resenas: ResenaDestacada[];
}

// Top 6 reseñas (4-5★), cacheadas en backend — usado en el home.
export async function apiGetResenasDestacadas(): Promise<ResenasDestacadasResponse> {
  return apiFetch<ResenasDestacadasResponse>("/resenas/destacadas");
}

export interface ResenasListResponse {
  total: number;
  promedio: number;
  resenas: ResenaDestacada[];
}

// Listado paginado de TODAS las reseñas — usado en la página /testimonios.
export async function apiGetResenas(
  skip = 0,
  limit = 12,
): Promise<ResenasListResponse> {
  return apiFetch<ResenasListResponse>(`/resenas?skip=${skip}&limit=${limit}`);
}

export interface ResenaCreateInput {
  id_reserva: number;
  calificacion: number;
  comentario: string;
  foto_url?: string;
}

export interface ResenaCreateResponse {
  id_resena: number;
  id_reserva: number;
  id_hotel: number;
  calificacion: number;
  comentario: string;
  foto_url?: string | null;
  fecha_creacion: string;
  nombre_cliente?: string | null;
}

// Requiere sesión iniciada (Authorization: Bearer). El backend valida que la
// reserva sea del cliente autenticado y que no tenga ya una reseña.
export async function apiCrearResena(
  data: ResenaCreateInput,
): Promise<ResenaCreateResponse> {
  return apiFetch<ResenaCreateResponse>("/resenas", {
    method: "POST",
    body: data,
  });
}
