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
