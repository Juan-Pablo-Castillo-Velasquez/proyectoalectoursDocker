import type { ReactNode } from "react";

export interface TimelineItem {
  id: number | string;
  /** Fila de chips del evento — ej. un StatusBadge o dos encadenados con una flecha */
  badge: ReactNode;
  /** Línea secundaria — ej. "Nombre · hace 5 min" */
  meta: ReactNode;
  /** Texto opcional en cursiva (comentario/motivo) */
  detail?: ReactNode;
}

interface TimelineProps {
  items: TimelineItem[];
  loading?: boolean;
  emptyLabel?: string;
}

// Línea de tiempo genérica (punto + línea conectora) — extraída de
// ModuleReservas.tsx para que cualquier módulo con un historial de eventos
// reales (reservas, solicitudes de cancelación, futuro perfil de cliente)
// la use igual, en vez de que cada uno dibuje su propia versión. No decide
// el contenido de cada evento: el caller arma `badge`/`meta`/`detail` con
// sus propios datos reales.
export default function Timeline({ items, loading, emptyLabel = "Sin eventos registrados todavía" }: TimelineProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[0, 1, 2].map(i => (
          <div key={i} className="h-12 bg-muted/40 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }
  if (items.length === 0) {
    return (
      <p className="text-xs text-muted-foreground text-center py-6">{emptyLabel}</p>
    );
  }
  return (
    <div>
      {items.map((item, i) => (
        <div key={item.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <span className="w-2.5 h-2.5 rounded-full bg-primary mt-1.5 flex-shrink-0 ring-4 ring-card" />
            {i < items.length - 1 && <span className="w-px flex-1 bg-border my-0.5" />}
          </div>
          <div className={`flex-1 min-w-0 ${i < items.length - 1 ? "pb-4" : ""}`}>
            <div className="flex items-center gap-1.5 flex-wrap mb-1">{item.badge}</div>
            <p className="text-[11px] text-muted-foreground">{item.meta}</p>
            {item.detail && <p className="text-xs text-foreground/80 mt-1 italic">{item.detail}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
