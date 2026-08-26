import { ESTADO_COLOR } from "../types";

// Etiquetas legibles para los estados reales que ya existen en el backend
// (reservas: pendiente/confirmada/cancelada/finalizada — pagos: pendiente/
// procesando/pagado/rechazado/cancelado — solicitudes de cancelación:
// pendiente/aprobada/rechazada — usuarios: activo/inactivo). No inventa
// estados nuevos, solo les da una presentación visual consistente en
// todo el panel en vez de que cada módulo dibuje su propio badge.
const LABELS: Record<string, string> = {
  pendiente: "Pendiente",
  confirmada: "Confirmada",
  cancelada: "Cancelada",
  finalizada: "Finalizada",
  aprobada: "Aprobada",
  rechazada: "Rechazada",
  pagado: "Pagado",
  procesando: "Procesando",
  rechazado: "Rechazado",
  cancelado: "Cancelado",
  activo: "Activo",
  inactivo: "Inactivo",
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export default function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const key = (status || "").toLowerCase();
  const colorCls = ESTADO_COLOR[key] || "bg-muted text-muted-foreground";
  const label = LABELS[key] || status || "—";

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${colorCls} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current flex-shrink-0" />
      {label}
    </span>
  );
}
