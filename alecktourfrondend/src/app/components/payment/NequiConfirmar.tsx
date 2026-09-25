// components/payment/NequiConfirmar.tsx
// Paso posterior a NequiPayment.tsx: el pago quedó "procesando" en el
// backend (ver payment_service.py / reserva_route.py) y aquí se le pide al
// cliente que confirme que YA transfirió a NEQUI_DESTINO antes de crear la
// reserva de verdad -- a diferencia de PSE (que sigue auto-confirmándose
// solo tras una espera simulada), Nequi ahora depende de esta acción
// explícita del cliente, igual que pediría un negocio real sin pasarela.
import { Loader2, Smartphone } from "lucide-react";
import { motion } from "motion/react";
import { formatNequiDestino } from "./types";

export default function NequiConfirmar({
  amount,
  confirmando,
  onConfirmar,
}: {
  amount: number;
  confirmando: boolean;
  onConfirmar: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="rounded-xl border border-primary/25 bg-primary/[0.04] p-8 text-center"
    >
      <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
        <Smartphone className="w-7 h-7 text-primary" />
      </div>
      <p className="font-medium text-foreground">Falta tu transferencia por Nequi</p>
      <p className="text-sm text-muted-foreground mt-1.5">
        Envía <strong className="text-foreground">${amount.toLocaleString("es-CO")}</strong> a{" "}
        <span className="font-mono font-semibold text-foreground">{formatNequiDestino()}</span> desde tu app Nequi.
      </p>
      <p className="text-[11px] text-muted-foreground mt-1">Cuando ya lo hayas hecho, confirma aquí para crear tu reserva.</p>
      <button
        type="button"
        onClick={onConfirmar}
        disabled={confirmando}
        className="mt-5 inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:opacity-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {confirmando ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Confirmando...
          </>
        ) : (
          "Ya transferí, confirmar pago"
        )}
      </button>
    </motion.div>
  );
}
