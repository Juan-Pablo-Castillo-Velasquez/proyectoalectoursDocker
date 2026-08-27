// Cache simple en localStorage con expiración (TTL), mismo espíritu que el
// cache de Redis del backend (get_cached/set_cached en app/core/cache.py)
// pero del lado del navegador. Se usa para pintar listas del panel de admin
// (clientes/hoteles/paquetes) al instante desde la última copia guardada
// mientras se pide la versión fresca a la API en segundo plano — evita la
// pantalla en blanco/"cargando..." cada vez que se entra a una pestaña que
// ya se había cargado antes, sin dejar de reflejar datos reales (la copia
// en caché siempre se reemplaza por la respuesta real de la API apenas
// llega, nunca se inventa ni se mantiene indefinidamente).
interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export function getLocalCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    if (!entry || typeof entry.expiresAt !== "number" || Date.now() > entry.expiresAt) {
      localStorage.removeItem(key);
      return null;
    }
    return entry.value;
  } catch {
    // localStorage puede fallar (modo privado, JSON corrupto, cuota llena) —
    // no es crítico, simplemente se sigue sin caché para esta clave.
    return null;
  }
}

export function setLocalCache<T>(key: string, value: T, ttlSeconds: number): void {
  try {
    const entry: CacheEntry<T> = { value, expiresAt: Date.now() + ttlSeconds * 1000 };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // Igual que arriba: si falla, simplemente no se cachea esta vez.
  }
}

export function clearLocalCache(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // no-op
  }
}
