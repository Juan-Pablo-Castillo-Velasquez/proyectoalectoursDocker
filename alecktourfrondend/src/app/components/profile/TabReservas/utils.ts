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