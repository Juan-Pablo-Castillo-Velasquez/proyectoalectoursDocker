// components/payment/PayPalPayment.tsx
// Método visual desacoplado por completo de Card/PSE/Nequi — no requiere
// ningún dato adicional, listo para integrar PayPal real más adelante sin
// tocar el resto de la arquitectura de pagos.
import { Wallet } from "lucide-react";

export default function PayPalPayment({ amount }: { amount: number }) {
  return (
    <div className="rounded-xl border border-border bg-muted/40 p-5 flex items-start gap-4">
      <div className="w-10 h-10 rounded-lg bg-[#003087]/10 flex items-center justify-center border border-[#003087]/20 shrink-0">
        <Wallet className="w-5 h-5 text-[#003087]" />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">Continuarás con PayPal</p>
        <p className="text-xs text-muted-foreground mt-1">
          Al confirmar, te redirigiríamos a PayPal para autorizar ${amount.toLocaleString("es-CO")} (simulado en este entorno).
        </p>
      </div>
    </div>
  );
}
