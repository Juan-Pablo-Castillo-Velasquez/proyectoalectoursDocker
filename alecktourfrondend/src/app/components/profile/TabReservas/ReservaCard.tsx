import { ChevronRight, Plane } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import ComprobantePDF from "../ComprobantePDF";
import { ClienteResponse } from "../../../services/cliente.service";
import { estadoConfig } from "./constants";
import { fmt, nights } from "./utils";

interface Props {
  reserva: any;
  expanded: boolean;
  onToggleExpand: () => void;
  clienteData: ClienteResponse | null;
  /** motivo ya enviado en esta sesión (si lo hay) — viene del estado `solicitadas` del padre */
  solicitudMotivo?: string;
  onSolicitarCancelacion: () => void;
  onDejarResena: () => void;
}

export default function ReservaCard({
  reserva,
  expanded,
  onToggleExpand,
  clienteData,
  solicitudMotivo,
  onSolicitarCancelacion,
  onDejarResena,
}: Props) {
  const estadoMostrar = solicitudMotivo
    ? "cancelacion_solicitada"
    : reserva.estado;
  const config = estadoConfig[estadoMostrar] ?? estadoConfig.pendiente;
  const Icon = config.icon;
  const noches = nights(reserva.fecha_inicio, reserva.fecha_fin);
  const yaSolicitada =
    !!solicitudMotivo ||
    reserva.estado === "cancelacion_solicitada" ||
    reserva.estado === "cancelada";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      className="bg-card text-card-foreground border border-border rounded-xl shadow-sm overflow-hidden transition-colors duration-200"
    >
      <div className="p-4 sm:p-5">
        {/* Header de la Tarjeta */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center shrink-0">
              <Plane className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">
                Reserva #ID-{reserva.id_reserva}
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Paquete #{reserva.id_paquete} · Registro:{" "}
                {fmt(reserva.fecha_reserva)}
              </p>
            </div>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 self-start sm:self-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${config.bg} ${config.color}`}
          >
            <Icon className="w-3.5 h-3.5" />
            {config.label}
          </span>
        </div>

        {/* Chips informativos */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
          <div className="bg-muted/40 border border-border/40 rounded-lg p-2.5">
            <span className="block text-[9px] font-bold uppercase tracking-wider text-muted-foreground/80">
              Fecha Ida
            </span>
            <span className="text-xs font-semibold text-foreground">
              {fmt(reserva.fecha_inicio)}
            </span>
          </div>
          <div className="bg-muted/40 border border-border/40 rounded-lg p-2.5">
            <span className="block text-[9px] font-bold uppercase tracking-wider text-muted-foreground/80">
              Fecha Regreso
            </span>
            <span className="text-xs font-semibold text-foreground">
              {fmt(reserva.fecha_fin)}
            </span>
          </div>
          <div className="bg-muted/40 border border-border/40 rounded-lg p-2.5">
            <span className="block text-[9px] font-bold uppercase tracking-wider text-muted-foreground/80">
              Estancia
            </span>
            <span className="text-xs font-semibold text-foreground">
              {noches} {noches === 1 ? "Noche" : "Noches"}
            </span>
          </div>
          <div className="bg-muted/40 border border-border/40 rounded-lg p-2.5">
            <span className="block text-[9px] font-bold uppercase tracking-wider text-muted-foreground/80">
              Importe Total
            </span>
            <span className="text-xs font-bold text-primary">
              ${Number(reserva.precio_total ?? 0).toLocaleString("es-CO")} COP
            </span>
          </div>
        </div>

        {/* Acciones principales */}
        <div className="flex flex-wrap items-center justify-between border-t border-border/60 pt-4 gap-2">
          <div className="flex items-center gap-2">
            {clienteData &&
              (reserva.estado === "confirmada" ||
                reserva.estado === "pendiente") && (
                <ComprobantePDF
                  reservaId={reserva.id_reserva}
                  clienteData={clienteData}
                />
              )}

            {!yaSolicitada && reserva.estado !== "finalizada" && (
              <button
                onClick={onSolicitarCancelacion}
                className="px-3 py-1.5 border border-destructive/30 text-destructive text-xs font-medium rounded-lg hover:bg-destructive/5 transition-all cursor-pointer"
              >
                Solicitar Cancelación
              </button>
            )}

            <button
              onClick={onDejarResena}
              className="px-3 py-1.5 border border-primary/30 text-primary text-xs font-medium rounded-lg hover:bg-primary/5 transition-all cursor-pointer"
            >
              Dejar reseña
            </button>
          </div>

          <button
            onClick={onToggleExpand}
            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors py-1.5 cursor-pointer"
          >
            <span>
              {expanded ? "Ocultar especificaciones" : "Ver especificaciones"}
            </span>
            <ChevronRight
              className={`w-3.5 h-3.5 transition-transform duration-200 ${expanded ? "rotate-90" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Desglose expandible */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden border-t border-border bg-muted/20"
          >
            <div className="p-4 sm:p-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-bold text-foreground text-xs uppercase tracking-wider text-muted-foreground/90">
                    Alojamiento & Logística
                  </h4>
                  <p className="text-muted-foreground">
                    Detalles del itinerario hotelero, locaciones de check-in y
                    asignaciones de cupos incluidos dentro de la tarifa.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-bold text-foreground text-xs uppercase tracking-wider text-muted-foreground/90">
                    Políticas de Modificación
                  </h4>
                  <p className="text-muted-foreground">
                    Toda alteración en las fechas de estancia o variaciones en
                    el número de pasajeros declarados debe tramitarse con 5
                    días hábiles de anticipación.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}