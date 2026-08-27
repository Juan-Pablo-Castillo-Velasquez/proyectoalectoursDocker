import type { ReactNode } from "react";
import { motion } from "motion/react";

interface ModalBackdropProps {
  onClick?: () => void;
  /** z-index del fondo — cada pop-up "a mano" del sitio (login, registro,
   * términos, privacidad, restablecer contraseña) usaba un valor distinto
   * (z-50/z-[100]/z-[200]) sin ningún criterio real entre ellos; se deja
   * configurable para no forzar un único valor donde antes había varios
   * modales apilándose a propósito (ej. Términos/Privacidad sobre Registro). */
  zIndex?: number;
  className?: string;
  children: ReactNode;
}

// Fondo semitransparente + centrado compartido, para pop-ups que arman
// ellos mismos su propio contenedor de pantalla completa (LoginModal,
// RegisterModal, TerminosModal, PrivacidadModal, ResetPasswordModal). Antes
// cada uno repetía casi el mismo
// "fixed inset-0 bg-.../XX backdrop-blur-... flex items-center justify-center"
// con ligeras inconsistencias de opacidad/blur entre sí — ahora todos usan
// este mismo fondo (bg-background/80, token de tema, no un negro fijo que
// se ve distinto en modo claro/oscuro).
export default function ModalBackdrop({ onClick, zIndex = 100, className = "", children }: ModalBackdropProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ zIndex }}
      className={`fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto ${className}`}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}

// Variante "solo la capa oscura": para modales que ya arman su propio
// contenedor fixed+flex por fuera (ver ModalCancelacion/ModalResena/
// ModalReservaDetalle en components/profile/TabReservas) y solo
// necesitaban la capa de fondo detrás de la tarjeta — mismo
// "absolute inset-0 bg-black/60 backdrop-blur-sm" repetido tal cual en
// los tres archivos, ahora en un solo lugar.
export function ModalOverlay({ onClick, className = "" }: { onClick?: () => void; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`absolute inset-0 bg-black/60 backdrop-blur-sm ${className}`}
      onClick={onClick}
    />
  );
}
