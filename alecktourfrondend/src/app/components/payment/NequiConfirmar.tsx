// components/payment/NequiConfirmar.tsx
// Paso posterior a NequiPayment.tsx: el pago quedó "procesando" en el
// backend (ver payment_service.py / reserva_route.py) y aquí se le pide al
// cliente que confirme que YA transfirió a NEQUI_DESTINO -- puede adjuntar
// el comprobante ahí mismo (opcional) o simplemente guardarlo, porque un
// asesor/admin va a revisar y confirmar el pago después de verificarlo
// (ver confirmar_pago), no se aprueba solo como antes.
import { useRef, useState } from "react";
import { AlertCircle, Check, Loader2, Paperclip, Smartphone, X } from "lucide-react";
import { motion } from "motion/react";
import { formatNequiDestino } from "./types";

export default function NequiConfirmar({
  amount,
  comprobanteSubiendo,
  comprobanteSubido,
  comprobanteError,
  onSubirComprobante,
  onConfirmar,
}: {
  amount: number;
  comprobanteSubiendo: boolean;
  comprobanteSubido: boolean;
  comprobanteError?: string | null;
  onSubirComprobante: (file: File) => void;
  onConfirmar: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [nombreArchivo, setNombreArchivo] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setNombreArchivo(file.name);
    onSubirComprobante(file);
  };

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

      {/* Comprobante: opcional acá mismo, o simplemente lo guarda -- de
          cualquier forma un asesor se pondrá en contacto para verificar el
          pago antes de confirmar la reserva. */}
      <div className="mt-4 text-left rounded-lg border border-dashed border-border bg-card p-3.5">
        <input ref={inputRef} type="file" accept="image/*,.pdf" onChange={handleFileChange} className="hidden" />
        {comprobanteSubido ? (
          <p className="flex items-center gap-2 text-xs font-medium text-success">
            <Check className="w-4 h-4 flex-shrink-0" /> Comprobante adjuntado{nombreArchivo ? `: ${nombreArchivo}` : ""}
          </p>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={comprobanteSubiendo}
            className="flex items-center gap-2 text-xs font-medium text-primary hover:text-primary/80 disabled:opacity-60 transition-colors"
          >
            {comprobanteSubiendo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
            {comprobanteSubiendo ? "Subiendo comprobante..." : "Adjuntar comprobante (opcional)"}
          </button>
        )}
        {comprobanteError && (
          <p className="flex items-center gap-1.5 text-[11px] text-destructive mt-1.5">
            <X className="w-3 h-3 flex-shrink-0" /> {comprobanteError}
          </p>
        )}
        <p className="text-[11px] text-muted-foreground mt-1.5 flex items-start gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-px" />
          Si prefieres no subirlo ahora, guárdalo: un agente se pondrá en contacto contigo para verificar el pago.
        </p>
      </div>

      <button
        type="button"
        onClick={onConfirmar}
        disabled={comprobanteSubiendo}
        className="mt-5 inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:opacity-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
      >
        Ya transferí
      </button>
    </motion.div>
  );
}
