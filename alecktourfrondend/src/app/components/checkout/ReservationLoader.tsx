import { AlertCircle, Plane, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";

interface ReservationLoaderProps {
  /** Paso real del flujo de checkout: 1 = creando la reserva, 2 = iniciando
   * el pago, 3 = confirmando el resultado. Siempre reflejan progreso real
   * de la API (ver Checkout.tsx), nunca un temporizador fijo. */
  step: 1 | 2 | 3;
  isVisible: boolean;
  /** Si tiene valor, el overlay deja de mostrar el paso y muestra este
   * mensaje de error con un botón para cerrarlo. */
  error?: string | null;
  /** Se llama al hacer clic en cerrar (solo relevante cuando hay error). */
  onDismiss?: () => void;
}

const TEXTOS_PASO: Record<1 | 2 | 3, string> = {
  1: "Verificando disponibilidad y creando tu reserva...",
  2: "Iniciando tu pago de forma segura...",
  3: "Confirmando tu reserva...",
};

/**
 * Overlay de pantalla completa para el tramo crítico del checkout (crear
 * reserva + iniciar pago — ver plan de mejora, sección 1). No reemplaza el
 * flujo de <PaymentStatus /> ya existente para la espera async de
 * PSE/Nequi ni para el resultado aprobado/rechazado: Checkout.tsx solo lo
 * muestra mientras paymentStatus sigue en 'idle'.
 */
export default function ReservationLoader({ step, isVisible, error, onDismiss }: ReservationLoaderProps) {
  // Bloquea el scroll de fondo mientras el overlay está visible, y lo
  // restaura siempre al ocultarse o desmontar — incluso si el cierre
  // ocurre por un error, nunca queda "overflow:hidden" colgado en <body>.
  useEffect(() => {
    if (!isVisible) return;
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflowPrevio;
    };
  }, [isVisible]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: "easeInOut" }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
        >
          <div className="w-full max-w-sm rounded-2xl bg-card border border-border shadow-lg p-8 flex flex-col items-center text-center gap-5">
            {error ? (
              <>
                <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertCircle className="w-7 h-7 text-destructive" />
                </div>
                <div aria-live="polite" className="space-y-1">
                  <p className="font-semibold text-foreground">No pudimos continuar</p>
                  <p className="text-sm text-muted-foreground">{error}</p>
                </div>
                <button
                  type="button"
                  onClick={onDismiss}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  <X className="w-4 h-4" /> Cerrar e intentar de nuevo
                </button>
              </>
            ) : (
              <>
                <motion.div
                  animate={{ y: [0, -8, 0], rotate: [0, 6, -6, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center"
                >
                  <Plane className="w-7 h-7 text-primary" />
                </motion.div>

                <div aria-live="polite" className="min-h-[2.5rem] flex items-center justify-center">
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={step}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.3 }}
                      className="text-sm font-medium text-foreground"
                    >
                      {TEXTOS_PASO[step]}
                    </motion.p>
                  </AnimatePresence>
                </div>

                <div className="w-full flex items-center gap-1.5">
                  {([1, 2, 3] as const).map((s) => (
                    <span
                      key={s}
                      className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                        s <= step ? "bg-primary" : "bg-muted"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
