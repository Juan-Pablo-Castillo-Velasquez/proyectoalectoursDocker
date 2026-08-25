import {
  Bed,
  Calendar,
  Compass,
  CreditCard,
  History,
  Loader2,
  MapPin,
  Package,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import {
  ReservaDetail,
  reservaDetailService,
  reservaService,
} from "../../../services/reserva.service";
import { estadoConfig } from "./constants";
import { fmt } from "./utils";

interface HabitacionDetalle {
  id_habitacion: number;
  numero_habitacion: string;
  nombre_tipo: string;
  nombre_hotel: string;
  fecha_checkin: string | null;
  fecha_checkout: string | null;
  precio_acordado: number | null;
  precio_noche: number;
  estado: string;
}

interface ServicioDetalle {
  id_servicio: number;
  nombre_servicio: string;
  descripcion: string | null;
  duracion_horas: number | null;
  nombre_categoria: string | null;
  fecha_servicio: string | null;
  numero_personas: number | null;
  precio_acordado: number | null;
}

interface HistorialDetalle {
  id_historial: number;
  estado_anterior: string | null;
  estado_nuevo: string | null;
  fecha_cambio: string;
  comentarios: string | null;
  nombre_empleado: string | null;
}

interface Props {
  reservaId: number;
  onClose: () => void;
}

const money = (valor: number | null | undefined) =>
  `$${Number(valor ?? 0).toLocaleString("es-CO")} COP`;

export default function ModalReservaDetalle({ reservaId, onClose }: Props) {
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detalle, setDetalle] = useState<ReservaDetail | null>(null);
  const [habitaciones, setHabitaciones] = useState<HabitacionDetalle[]>([]);
  const [servicios, setServicios] = useState<ServicioDetalle[]>([]);
  const [historial, setHistorial] = useState<HistorialDetalle[]>([]);

  useEffect(() => {
    let cancelado = false;
    setCargando(true);
    setError(null);

    Promise.all([
      reservaService.getById(reservaId),
      reservaDetailService.getHabitaciones(reservaId),
      reservaDetailService.getServicios(reservaId),
      reservaDetailService.getHistorial(reservaId),
    ])
      .then(([reservaDetalle, hab, serv, hist]) => {
        if (cancelado) return;
        setDetalle(reservaDetalle as unknown as ReservaDetail);
        setHabitaciones(hab as HabitacionDetalle[]);
        setServicios(serv as ServicioDetalle[]);
        setHistorial(hist as HistorialDetalle[]);
      })
      .catch(() => {
        if (!cancelado) setError("No pudimos cargar el detalle de esta reserva.");
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [reservaId]);

  const config = detalle ? estadoConfig[detalle.estado] ?? estadoConfig.pendiente : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative bg-card text-card-foreground border border-border rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col transition-colors duration-200"
      >
        {/* Header */}
        <div className="bg-primary p-6 text-primary-foreground shrink-0 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-primary-foreground/70 hover:text-primary-foreground transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <h3 className="font-bold text-lg tracking-tight pr-8">
            {detalle?.paquete?.nombre_paquete ?? `Reserva #${reservaId}`}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-primary-foreground/80 text-xs">
              Reserva #ID-{reservaId}
            </p>
            {config && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/15">
                {config.label}
              </span>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {cargando ? (
            <div className="py-12 text-center">
              <Loader2 className="w-7 h-7 text-primary animate-spin mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Cargando especificaciones...</p>
            </div>
          ) : error ? (
            <p className="text-sm text-destructive text-center py-8">{error}</p>
          ) : (
            <>
              {/* Paquete */}
              {detalle?.paquete && (
                <section>
                  <h4 className="flex items-center gap-2 font-bold text-foreground text-xs uppercase tracking-wider text-muted-foreground/90 mb-2">
                    <Package className="w-3.5 h-3.5 text-primary" />
                    Paquete contratado
                  </h4>
                  <div className="bg-muted/30 border border-border/50 rounded-xl p-4">
                    {detalle.paquete.descripcion && (
                      <p className="text-sm text-foreground mb-2">{detalle.paquete.descripcion}</p>
                    )}
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {fmt(detalle.fecha_inicio)} → {fmt(detalle.fecha_fin)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {detalle.numero_personas} pasajero{detalle.numero_personas !== 1 ? "s" : ""}
                      </span>
                      {detalle.paquete.duracion_dias && (
                        <span className="flex items-center gap-1">
                          <Compass className="w-3.5 h-3.5" />
                          {detalle.paquete.duracion_dias} días
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-4 text-[11px] text-muted-foreground/80 mt-2 pt-2 border-t border-border/40">
                      <span>Reservado el {fmt(detalle.fecha_reserva)}</span>
                      {detalle.canal_origen && (
                        <span className="capitalize">Canal: {detalle.canal_origen}</span>
                      )}
                    </div>
                  </div>
                </section>
              )}

              {/* Asesor asignado */}
              {detalle?.empleado && (
                <section>
                  <h4 className="flex items-center gap-2 font-bold text-foreground text-xs uppercase tracking-wider text-muted-foreground/90 mb-2">
                    <Users className="w-3.5 h-3.5 text-primary" />
                    Tu asesor asignado
                  </h4>
                  <div className="bg-muted/30 border border-border/50 rounded-xl p-4">
                    <p className="text-sm font-semibold text-foreground">
                      {detalle.empleado.nombre} {detalle.empleado.apellido}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {[detalle.empleado.correo_electronico, detalle.empleado.celular].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                </section>
              )}

              {/* Hospedaje */}
              {habitaciones.length > 0 && (
                <section>
                  <h4 className="flex items-center gap-2 font-bold text-foreground text-xs uppercase tracking-wider text-muted-foreground/90 mb-2">
                    <Bed className="w-3.5 h-3.5 text-primary" />
                    Alojamiento
                  </h4>
                  <div className="space-y-2">
                    {habitaciones.map((h) => (
                      <div
                        key={h.id_habitacion}
                        className="bg-muted/30 border border-border/50 rounded-xl p-4 flex items-center justify-between gap-3"
                      >
                        <div>
                          <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-primary" />
                            {h.nombre_hotel}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {h.nombre_tipo} · Hab. {h.numero_habitacion}
                            {h.fecha_checkin && h.fecha_checkout && (
                              <> · {fmt(h.fecha_checkin)} – {fmt(h.fecha_checkout)}</>
                            )}
                          </p>
                        </div>
                        <p className="text-xs font-bold text-primary shrink-0">
                          {money(h.precio_acordado ?? h.precio_noche)}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Servicios */}
              {servicios.length > 0 && (
                <section>
                  <h4 className="flex items-center gap-2 font-bold text-foreground text-xs uppercase tracking-wider text-muted-foreground/90 mb-2">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    Servicios incluidos
                  </h4>
                  <div className="space-y-2">
                    {servicios.map((s) => (
                      <div
                        key={s.id_servicio}
                        className="bg-muted/30 border border-border/50 rounded-xl p-4 flex items-center justify-between gap-3"
                      >
                        <div>
                          <p className="text-sm font-semibold text-foreground">{s.nombre_servicio}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {[s.nombre_categoria, s.fecha_servicio ? fmt(s.fecha_servicio) : null]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        </div>
                        {s.precio_acordado != null && (
                          <p className="text-xs font-bold text-primary shrink-0">
                            {money(s.precio_acordado)}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Pagos */}
              {detalle?.pagos && detalle.pagos.length > 0 && (
                <section>
                  <h4 className="flex items-center gap-2 font-bold text-foreground text-xs uppercase tracking-wider text-muted-foreground/90 mb-2">
                    <CreditCard className="w-3.5 h-3.5 text-primary" />
                    Pagos
                  </h4>
                  <div className="space-y-2">
                    {detalle.pagos.map((p) => (
                      <div
                        key={p.id_pago}
                        className="bg-muted/30 border border-border/50 rounded-xl p-4 flex items-center justify-between gap-3"
                      >
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {p.metodo_pago?.nombre_metodo ?? "Método no especificado"}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {fmt(p.fecha_pago)} · {p.estado}
                          </p>
                        </div>
                        <p className="text-xs font-bold text-primary shrink-0">{money(p.monto)}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Historial */}
              {historial.length > 0 && (
                <section>
                  <h4 className="flex items-center gap-2 font-bold text-foreground text-xs uppercase tracking-wider text-muted-foreground/90 mb-2">
                    <History className="w-3.5 h-3.5 text-primary" />
                    Historial de estado
                  </h4>
                  <div className="space-y-2">
                    {historial.map((h) => (
                      <div key={h.id_historial} className="flex gap-3 text-xs">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                        <div>
                          <p className="text-foreground font-medium">
                            {h.estado_anterior ? `${h.estado_anterior} → ${h.estado_nuevo}` : h.estado_nuevo}
                            <span className="text-muted-foreground font-normal"> · {fmt(h.fecha_cambio)}</span>
                          </p>
                          {h.comentarios && (
                            <p className="text-muted-foreground mt-0.5">{h.comentarios}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
