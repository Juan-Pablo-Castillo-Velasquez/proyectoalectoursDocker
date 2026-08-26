// components/payment/PaymentSelector.tsx
// Lista de métodos de pago reales (traídos de /metodos-pago) para elegir
// cuál usar. No sabe nada de tarjeta/PSE/Nequi/PayPal en particular — solo
// selecciona un id_metodo_pago; Checkout decide qué componente de método
// renderizar debajo según el `codigo` del método elegido.
import { Banknote, Building2, CreditCard, Smartphone, Wallet } from "lucide-react";
import { motion } from "motion/react";
import type { MetodoPago } from "../../services/reserva.service";

const ICONS: Record<string, typeof CreditCard> = {
  tarjeta_credito: CreditCard,
  tarjeta_debito: CreditCard,
  pse: Building2,
  nequi: Smartphone,
  paypal: Wallet,
};

export default function PaymentSelector({
  metodos,
  selectedId,
  onSelect,
}: {
  metodos: MetodoPago[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {metodos.map((m) => {
        const Icon = ICONS[m.codigo] ?? Banknote;
        const active = selectedId === m.id_metodo;
        return (
          <motion.label
            key={m.id_metodo}
            whileHover={{ y: -1 }}
            className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer border transition-all ${
              active ? "border-primary bg-primary/5 shadow-xs" : "border-border bg-card hover:border-border/80"
            }`}
          >
            <input
              type="radio"
              name="metodo"
              checked={active}
              onChange={() => onSelect(m.id_metodo)}
              className="w-4 h-4 text-primary focus:ring-primary border-border bg-input-background"
            />
            <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="text-sm font-medium text-foreground">{m.nombre_metodo}</span>
          </motion.label>
        );
      })}
    </div>
  );
}
