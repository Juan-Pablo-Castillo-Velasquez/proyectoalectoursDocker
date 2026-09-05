import { motion } from "motion/react";

// Acentos puramente decorativos para cuando el tema de temporada activo es
// Halloween (ver TemaContext.tsx / clave "halloween"). Antes la única señal
// de temporada en el home era el badge de texto+ícono del navbar -- esto
// agrega calabaza, murciélagos y una telaraña como toques discretos en las
// esquinas del Hero, en opacidad baja y sin sombras (pedido explícito:
// "mantener sombras mínimas"). Los SVG son geometría propia dibujada a
// mano (líneas/curvas simples), no un ícono de terceros ni un asset
// descargado -- así no depende de ninguna licencia ni de Cloudinary.
//
// aria-hidden porque es decoración ambiental, no información: un lector
// de pantalla no gana nada anunciando "telaraña, murciélago, calabaza".
export default function HalloweenAccents() {
  return (
    <div
      className="absolute inset-0 z-[6] overflow-hidden pointer-events-none"
      aria-hidden="true"
    >
      {/* Telaraña — esquina superior izquierda */}
      <svg
        viewBox="0 0 120 120"
        className="absolute -top-3 -left-3 w-24 h-24 sm:w-32 sm:h-32 text-white/20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
      >
        <path d="M0 0L120 0M0 0L120 40M0 0L120 80M0 0L120 120M0 0L80 120M0 0L40 120M0 0L0 120" />
        <path d="M30 0A30 30 0 0 1 0 30" />
        <path d="M60 0A60 60 0 0 1 0 60" />
        <path d="M90 0A90 90 0 0 1 0 90" />
      </svg>

      {/* Murciélagos — esquina superior derecha, con un vuelo sutil */}
      <motion.svg
        viewBox="0 0 64 32"
        className="absolute top-10 right-12 w-9 h-auto text-white/40"
        fill="currentColor"
        animate={{ y: [0, -6, 0], x: [0, 5, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        <path d="M32 10c-2-4-8-8-14-6 3 1 5 3 6 5-6-2-12 0-16 5 5-1 9 0 11 2-5 1-9 4-11 8 5-3 10-4 14-3-2 3-2 6-1 9 2-4 5-7 11-9 6 2 9 5 11 9 1-3 1-6-1-9 4-1 9 0 14 3-2-4-6-7-11-8 2-2 6-3 11-2-4-5-10-7-16-5 1-2 3-4 6-5-6-2-12 2-14 6Z" />
      </motion.svg>

      <motion.svg
        viewBox="0 0 64 32"
        className="absolute top-24 right-28 w-5 h-auto text-white/25"
        fill="currentColor"
        animate={{ y: [0, -4, 0], x: [0, -3, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
      >
        <path d="M32 10c-2-4-8-8-14-6 3 1 5 3 6 5-6-2-12 0-16 5 5-1 9 0 11 2-5 1-9 4-11 8 5-3 10-4 14-3-2 3-2 6-1 9 2-4 5-7 11-9 6 2 9 5 11 9 1-3 1-6-1-9 4-1 9 0 14 3-2-4-6-7-11-8 2-2 6-3 11-2-4-5-10-7-16-5 1-2 3-4 6-5-6-2-12 2-14 6Z" />
      </motion.svg>

      {/* Calabaza — esquina inferior izquierda, silueta simple con "gajos" */}
      <svg
        viewBox="0 0 64 64"
        className="absolute -bottom-4 -left-4 w-20 h-20 sm:w-28 sm:h-28 text-white/15"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M20 30c0-10 5-16 12-16s12 6 12 16-5 20-12 20-12-10-12-20Z" />
        <path d="M26 16c2-6 4-9 6-9M38 16c-2-6-4-9-6-9" strokeLinecap="round" />
        <path d="M26 20v26M32 14v36M38 20v26" strokeWidth="1.5" opacity="0.6" />
        <rect x="29" y="4" width="6" height="8" rx="2" fill="currentColor" stroke="none" />
      </svg>
    </div>
  );
}
