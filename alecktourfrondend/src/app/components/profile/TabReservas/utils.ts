export const nights = (a: string, b: string) =>
  Math.max(
    1,
    Math.ceil((new Date(b).getTime() - new Date(a).getTime()) / 86400000),
  );

export const fmt = (d: string, opts?: Intl.DateTimeFormatOptions) =>
  new Date(d).toLocaleDateString(
    "es-CO",
    opts ?? { day: "numeric", month: "short", year: "numeric" },
  );


  /**
 * Parsea "YYYY-MM-DD" (o timestamps ISO) en horario LOCAL para evitar
 * el desfase de timezone que producía new Date(string) al interpretar
 * la fecha como UTC.
 */
export function parseFechaLocal(fecha: string): Date {
  if (!fecha) return new Date(NaN);
  const soloFecha = fecha.split("T")[0];
  const [y, m, d] = soloFecha.split("-").map(Number);
  if (!y || !m || !d) return new Date(fecha);
  return new Date(y, m - 1, d);
}

export type EstadoViaje = "futuro" | "hoy" | "en_curso" | "finalizado";

/**
 * Determina en qué punto de su ciclo de vida está un viaje respecto a "hoy":
 * - futuro: aún no llega la fecha de check-in
 * - hoy: el check-in es exactamente hoy
 * - en_curso: ya empezó y todavía no llega el check-out
 * - finalizado: el check-out ya pasó
 */
export function getEstadoViaje(
  fechaInicio: string,
  fechaFin: string,
  hoy: Date,
): EstadoViaje {
  const ini = parseFechaLocal(fechaInicio).getTime();
  const fin = parseFechaLocal(fechaFin).getTime();
  const h = hoy.getTime();
  if (h < ini) return "futuro";
  if (h === ini) return "hoy";
  if (h <= fin) return "en_curso";
  return "finalizado";
}