import {
  CloudSnow,
  Flame,
  Flower2,
  Ghost,
  Gift,
  Heart,
  Leaf,
  LucideIcon,
  Moon,
  PartyPopper,
  Snowflake,
  Sparkles,
  Star,
  Sun,
  TreePine,
  Umbrella,
} from "lucide-react";

// Catálogo cerrado de íconos decorativos para temas de temporada (Navidad,
// Halloween, Amor y Amistad, etc.) -- espejo exacto del allowlist del
// backend (backend/app/schemas/tema_schema.py::ICONOS_PERMITIDOS). Nunca
// se resuelve un nombre por string dinámico/import(), para no arriesgar
// un build roto por un typo del admin: siempre es una búsqueda en este
// mapa fijo, con Sparkles como respaldo si el valor no existe.
export const TEMA_ICONOS: Record<string, LucideIcon> = {
  sparkles: Sparkles,
  snowflake: Snowflake,
  "tree-pine": TreePine,
  ghost: Ghost,
  heart: Heart,
  flower2: Flower2,
  sun: Sun,
  umbrella: Umbrella,
  "party-popper": PartyPopper,
  gift: Gift,
  star: Star,
  moon: Moon,
  "cloud-snow": CloudSnow,
  flame: Flame,
  leaf: Leaf,
};

// Mismo orden en el que aparecen como opciones en el picker de
// ModuleTemas.tsx -- los primeros 7 son los que ya usan los temas
// sembrados de fábrica, el resto queda disponible para temas nuevos.
export const TEMA_ICONOS_OPCIONES: { valor: string; etiqueta: string; Icono: LucideIcon }[] = [
  { valor: "sparkles", etiqueta: "Destellos (marca)", Icono: Sparkles },
  { valor: "tree-pine", etiqueta: "Árbol de navidad", Icono: TreePine },
  { valor: "snowflake", etiqueta: "Copo de nieve", Icono: Snowflake },
  { valor: "ghost", etiqueta: "Fantasma", Icono: Ghost },
  { valor: "heart", etiqueta: "Corazón", Icono: Heart },
  { valor: "flower2", etiqueta: "Flor", Icono: Flower2 },
  { valor: "sun", etiqueta: "Sol", Icono: Sun },
  { valor: "party-popper", etiqueta: "Confeti / fin de año", Icono: PartyPopper },
  { valor: "umbrella", etiqueta: "Sombrilla", Icono: Umbrella },
  { valor: "gift", etiqueta: "Regalo", Icono: Gift },
  { valor: "star", etiqueta: "Estrella", Icono: Star },
  { valor: "moon", etiqueta: "Luna", Icono: Moon },
  { valor: "cloud-snow", etiqueta: "Nube con nieve", Icono: CloudSnow },
  { valor: "flame", etiqueta: "Llama", Icono: Flame },
  { valor: "leaf", etiqueta: "Hoja", Icono: Leaf },
];

/** Ícono decorativo del tema activo. Sparkles como respaldo seguro si el
 * tema no tiene ícono asignado (temas antiguos, o valor que ya no existe
 * en el catálogo) -- nunca deja el sitio sin decoración ni rompe el
 * render por un dato inesperado. */
export function getTemaIcono(icono: string | null | undefined): LucideIcon {
  if (icono && TEMA_ICONOS[icono]) return TEMA_ICONOS[icono];
  return Sparkles;
}
