// Paletas de color prestablecidas para el formulario de "Nuevo tema" --
// puntos de partida orientados a una agencia de viajes real (no solo las
// 7 temporadas ya sembradas en la base de datos), que el admin puede
// aplicar con un clic y seguir ajustando. Los 4 tonos de cada paleta ya
// están verificados contra WCAG 2.1 AA (>=4.5:1: primario vs texto
// blanco, secundario vs texto oscuro #1f1a12) con la misma fórmula de
// luminancia relativa que usa el verificador en vivo de ModuleTemas.tsx.
export interface PaletaPreset {
  clave: string;
  etiqueta: string;
  color_primario_claro: string;
  color_primario_oscuro: string;
  color_secundario_claro: string;
  color_secundario_oscuro: string;
  icono: string;
}

export const PALETAS_PRESET: PaletaPreset[] = [
  {
    clave: "verano-playa",
    etiqueta: "Verano y playa",
    color_primario_claro: "#0e7c86",
    color_primario_oscuro: "#057f8a",
    color_secundario_claro: "#e07a3f",
    color_secundario_oscuro: "#edb391",
    icono: "umbrella",
  },
  {
    clave: "otono-calido",
    etiqueta: "Otoño cálido",
    color_primario_claro: "#8a3b1e",
    color_primario_oscuro: "#c0532a",
    color_secundario_claro: "#c98a2e",
    color_secundario_oscuro: "#e7c797",
    icono: "flame",
  },
  {
    clave: "invierno-elegante",
    etiqueta: "Invierno elegante",
    color_primario_claro: "#0f2a4a",
    color_primario_oscuro: "#2973cc",
    color_secundario_claro: "#9aa5b1",
    color_secundario_oscuro: "#b7bfc7",
    icono: "moon",
  },
  {
    clave: "lujo-dorado",
    etiqueta: "Lujo dorado",
    color_primario_claro: "#1c1c1c",
    color_primario_oscuro: "#737373",
    color_secundario_claro: "#c9a227",
    color_secundario_oscuro: "#ead694",
    icono: "star",
  },
  {
    clave: "aventura-montana",
    etiqueta: "Aventura y montaña",
    color_primario_claro: "#1f5c3c",
    color_primario_oscuro: "#2c8254",
    color_secundario_claro: "#c2a24d",
    color_secundario_oscuro: "#decda0",
    icono: "leaf",
  },
  {
    clave: "minimalista",
    etiqueta: "Minimalista",
    color_primario_claro: "#3a3a42",
    color_primario_oscuro: "#727283",
    color_secundario_claro: "#b8763f",
    color_secundario_oscuro: "#debca0",
    icono: "gift",
  },
];
