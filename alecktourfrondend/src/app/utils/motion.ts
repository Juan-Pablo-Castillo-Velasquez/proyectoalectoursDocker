// Antes cada componente (Navbar, loaders, modales, cards de listados...)
// inventaba su propio duration/ease de Framer Motion -- valores mezclados
// sin ningún criterio compartido (0.15, 0.16, 0.18, 0.2, 0.25, 0.3, 0.35,
// 0.4, 0.45, 0.5, 0.55, 0.6, 0.65... casi siempre con "easeInOut" por
// defecto). Eso hacía que las animaciones se sintieran "sueltas" en vez de
// parte de un mismo sistema, aunque cada una por separado se viera bien.
//
// Esto centraliza una escala pequeña y deliberada -- 3 duraciones + 2
// curvas -- para que abrir un panel, entrar a un modal o hacer hover en un
// botón se sienta consistente en todo el sitio, igual que ya pasa con los
// tokens de color de theme.css. No reemplaza whileHover/whileTap ni
// animaciones decorativas en loop (shimmer, parallax lento): esto es solo
// para transiciones de UI (entradas, salidas, cambios de estado).

// easeOutQuart-ish -- desacelera con fuerza real al final, sensación
// "premium" en vez de la linealidad plana de easeInOut. Úsalo para
// transiciones normales: hover, cambios de tab, abrir/cerrar un panel.
export const EASE_SUAVE = [0.25, 0.1, 0.25, 1] as const;

// easeOutExpo -- arranca más rápido y frena de forma más pronunciada que
// EASE_SUAVE. Reservado para entradas grandes que deben sentirse con más
// peso: modales, cards que aparecen en un listado, el loader de la app.
export const EASE_ENTRADA = [0.16, 1, 0.3, 1] as const;

export const DURACION = {
  // Hover, micro-interacciones, feedback inmediato de un click.
  rapida: 0.18,
  // Transición normal: abrir/cerrar un panel, cambiar de tab, un tooltip.
  base: 0.35,
  // Entradas grandes: hero, modal, loader de página completa.
  lenta: 0.55,
} as const;
