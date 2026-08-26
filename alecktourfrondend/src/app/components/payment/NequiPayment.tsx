// components/payment/NequiPayment.tsx
// Flujo simulado de Nequi: solo número de celular. No depende de
// CardPayment, PSEPayment ni PayPalPayment.
import { NequiPaymentValue } from "./types";

export default function NequiPayment({
  value,
  onChange,
}: {
  value: NequiPaymentValue;
  onChange: (value: NequiPaymentValue) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-4">
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1.5">Número de celular Nequi</label>
        <input
          type="text"
          inputMode="numeric"
          placeholder="3001234567"
          value={value.celular}
          onChange={(e) => onChange({ celular: e.target.value.replace(/\D/g, "").slice(0, 10) })}
          className="w-full px-3 py-2.5 rounded-xl border border-border bg-input-background text-foreground text-sm font-mono focus:ring-2 focus:ring-primary/40 focus:outline-none"
        />
      </div>
      <p className="text-[11px] text-muted-foreground">
        Te enviaremos una solicitud de pago a tu app Nequi (simulada en este entorno). Un celular terminado en 0000 simula un rechazo.
      </p>
    </div>
  );
}
