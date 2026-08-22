import {
  AlertCircle,
  Ban,
  Calendar,
  CheckCircle,
  ChevronRight,
  Clock,
  Filter,
  Loader2,
  MessageSquare,
  Moon,
  Plane,
  Search,
  SendHorizonal,
  Sunrise,
  Sunset,
  Timer,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { Link } from "react-router";
import { ClienteResponse } from "../../services/cliente.service";
import { resenaService } from "../../services/resena.service";
import ComprobantePDF from "./ComprobantePDF";

// ── Helpers ────────────────────────────────────────────────────────────────
const estadoConfig: Record<
  string,
  { color: string; bg: string; icon: any; label: string }
> = {
  confirmada: {
    color: "text-green-600 dark:text-green-400 border-green-500/20",
    bg: "bg-green-500/10",
    icon: CheckCircle,
    label: "Confirmada",
  },
  pendiente: {
    color: "text-amber-600 dark:text-amber-400 border-amber-500/20",
    bg: "bg-amber-500/10",
    icon: AlertCircle,
    label: "Pendiente",
  },
  cancelada: {
    color: "text-destructive border-destructive/20",
    bg: "bg-destructive/10",
    icon: XCircle,
    label: "Cancelada",
  },
  finalizada: {
    color: "text-muted-foreground border-border",
    bg: "bg-muted",
    icon: CheckCircle,
    label: "Finalizada",
  },
  cancelacion_solicitada: {
    color: "text-purple-600 dark:text-purple-400 border-purple-500/20",
    bg: "bg-purple-500/10",
    icon: Clock,
    label: "Cancelación en trámite",
  },
};

const MOTIVOS = [
  "Cambio de planes personales",
  "Problema económico",
  "Emergencia médica o familiar",
  "Error al hacer la reserva",
  "Encontré una mejor opción",
  "Otro motivo",
];

const nights = (a: string, b: string) =>
  Math.max(
    1,
    Math.ceil((new Date(b).getTime() - new Date(a).getTime()) / 86400000),
  );

const fmt = (d: string, opts?: Intl.DateTimeFormatOptions) =>
  new Date(d).toLocaleDateString(
    "es-CO",
    opts ?? { day: "numeric", month: "short", year: "numeric" },
  );

// ── Modal cancelación ──────────────────────────────────────────────────────
interface ModalProps {
  reserva: any;
  onClose: () => void;
  onConfirm: (id: number, motivo: string) => void;
}

function ModalCancelacion({ reserva, onClose, onConfirm }: ModalProps) {
  const [motivo, setMotivo] = useState("");
  const [motivoCustom, setMotivoCustom] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const motivoFinal = motivo === "Otro motivo" ? motivoCustom : motivo;

  const handleEnviar = async () => {
    if (!motivoFinal.trim()) return;
    setEnviando(true);
    await new Promise((r) => setTimeout(r, 1200));
    setEnviando(false);
    setEnviado(true);
    setTimeout(() => {
      onConfirm(reserva.id_reserva, motivoFinal);
      onClose();
    }, 1800);
  };

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
        className="relative bg-card text-card-foreground border border-border rounded-2xl shadow-xl w-full max-w-md overflow-hidden transition-colors duration-200"
      >
        <div className="bg-destructive p-6 text-destructive-foreground">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
              <XCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg tracking-tight">
                Solicitar cancelación
              </h3>
              <p className="text-destructive-foreground/80 text-xs">
                Reserva asignada #{reserva.id_reserva}
              </p>
            </div>
          </div>
        </div>
        <div className="p-6">
          {!enviado ? (
            <>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-5 text-xs text-amber-600 dark:text-amber-400">
                <p className="font-bold mb-0.5">⚠️ Información importante</p>
                <p className="leading-relaxed">
                  Tu solicitud será evaluada bajo las políticas de la agencia.
                  Se enviará un correo con la resolución.
                </p>
              </div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" /> Selecciona el motivo
              </label>
              <div className="space-y-2 mb-4">
                {MOTIVOS.map((m) => (
                  <label
                    key={m}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all text-sm
                    ${motivo === m ? "border-primary bg-primary/5 text-foreground font-medium" : "border-border hover:bg-muted/50 text-muted-foreground"}`}
                  >
                    <input
                      type="radio"
                      name="motivo"
                      value={m}
                      checked={motivo === m}
                      onChange={() => setMotivo(m)}
                      className="accent-primary"
                    />
                    <span>{m}</span>
                  </label>
                ))}
              </div>
              <AnimatePresence>
                {motivo === "Otro motivo" && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden mb-4"
                  >
                    <textarea
                      value={motivoCustom}
                      onChange={(e) => setMotivoCustom(e.target.value)}
                      placeholder="Por favor, detalla los motivos del cambio..."
                      rows={3}
                      className="w-full border border-border bg-muted/30 text-foreground rounded-lg p-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 resize-none"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 border border-border text-muted-foreground rounded-lg text-sm font-medium hover:bg-muted hover:text-foreground transition-all"
                >
                  Volver
                </button>
                <button
                  onClick={handleEnviar}
                  disabled={!motivoFinal.trim() || enviando}
                  className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {enviando ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <SendHorizonal className="w-4 h-4" />
                      Enviar Solicitud
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-8 text-center"
            >
              <div className="w-14 h-14 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-7 h-7 text-green-500" />
              </div>
              <h4 className="text-base font-bold text-foreground mb-1">
                ¡Solicitud recibida correctamente!
              </h4>
              <p className="text-muted-foreground text-xs px-4">
                Hemos registrado tu caso. Te contactaremos vía correo
                electrónico a la brevedad.
              </p>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ── Modal de reseña ──────────────────────────────────────────────────────────
interface ModalResenaProps {
  reserva: any;
  onClose: () => void;
}

function ModalResena({ reserva, onClose }: ModalResenaProps) {
  const [calificacion, setCalificacion] = useState(0);
  const [comentario, setComentario] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEnviar = async () => {
    if (calificacion === 0 || comentario.trim().length < 10) return;
    setEnviando(true);
    setError(null);
    try {
      await resenaService.crear({
        id_reserva: reserva.id_reserva,
        calificacion,
        comentario: comentario.trim(),
      });
      setEnviado(true);
      setTimeout(onClose, 1800);
    } catch (err: any) {
      setError(
        String(err?.message ?? "").includes("409")
          ? "Ya dejaste una reseña para esta reserva."
          : "No pudimos guardar tu reseña. Intenta de nuevo.",
      );
    } finally {
      setEnviando(false);
    }
  };

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
        className="relative bg-card text-card-foreground border border-border rounded-2xl shadow-xl w-full max-w-md overflow-hidden transition-colors duration-200"
      >
        <div className="bg-primary p-6 text-primary-foreground">
          <h3 className="font-bold text-lg tracking-tight">
            Cuéntanos cómo te fue
          </h3>
          <p className="text-primary-foreground/80 text-xs">
            Reserva #{reserva.id_reserva}
          </p>
        </div>
        <div className="p-6">
          {!enviado ? (
            <>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                Calificación
              </label>
              <div className="flex gap-2 mb-5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setCalificacion(n)}
                    className={`w-9 h-9 rounded-lg border text-sm font-bold transition-all cursor-pointer
                      ${calificacion >= n ? "bg-[var(--chart-2)] border-[var(--chart-2)] text-[#513b12]" : "border-border text-muted-foreground hover:bg-muted"}`}
                  >
                    ★
                  </button>
                ))}
              </div>

              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                Tu comentario
              </label>
              <textarea
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                placeholder="Cuéntanos qué te gustó, qué mejorarías, o cualquier detalle de tu estadía..."
                rows={4}
                className="w-full border border-border bg-muted/30 text-foreground rounded-lg p-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 resize-none mb-4"
              />

              {error && (
                <p className="text-xs text-destructive mb-3">{error}</p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 border border-border text-muted-foreground rounded-lg text-sm font-medium hover:bg-muted hover:text-foreground transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleEnviar}
                  disabled={
                    calificacion === 0 ||
                    comentario.trim().length < 10 ||
                    enviando
                  }
                  className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {enviando ? "Enviando..." : "Publicar reseña"}
                </button>
              </div>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-8 text-center"
            >
              <div className="w-14 h-14 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-7 h-7 text-green-500" />
              </div>
              <h4 className="text-base font-bold text-foreground mb-1">
                ¡Gracias por tu reseña!
              </h4>
              <p className="text-muted-foreground text-xs px-4">
                Ya está publicada en la página del hotel.
              </p>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ── Calendario visual ──────────────────────────────────────────────────────
function CalendarioViaje({
  proxima,
  diasRestantes,
}: {
  proxima: any;
  diasRestantes: number;
}) {
  const ini = new Date(proxima.fecha_inicio);
  const fin = new Date(proxima.fecha_fin);
  const year = ini.getFullYear();
  const month = ini.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const checkIn = ini.getDate();
  const checkOut = fin.getDate();
  const monthName = ini.toLocaleDateString("es-CO", {
    month: "long",
    year: "numeric",
  });
  const noches = nights(proxima.fecha_inicio, proxima.fecha_fin);
  const ahora = new Date();
  const hoyDia = ahora.getDate();
  const hoyMes = ahora.getMonth();
  const esEsteMes = hoyMes === month;

  const urgencia =
    diasRestantes === 0
      ? {
          label: "¡Tu itinerario inicia hoy! Buen viaje ✈️",
          className:
            "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
        }
      : diasRestantes <= 3
        ? {
            label: `¡Atención, faltan solo ${diasRestantes} días!`,
            className:
              "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
          }
        : {
            label: `Faltan ${diasRestantes} días para el inicio del viaje`,
            className: "bg-muted/80 text-muted-foreground border-border",
          };

  return (
    <div className="bg-card text-card-foreground border border-border rounded-xl shadow-md overflow-hidden transition-colors duration-200">
      {/* Banner Principal */}
      <div className="bg-gradient-to-br from-primary via-primary/95 to-primary/90 p-5 text-primary-foreground">
        <div className="flex items-start justify-between mb-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-75">
              Próximo Itinerario
            </span>
            <h3 className="text-xl font-bold tracking-tight leading-tight">
              Paquete Turístico #{proxima.id_paquete}
            </h3>
            <p className="text-xs opacity-70 mt-0.5">
              Identificador de Reserva: #{proxima.id_reserva}
            </p>
          </div>
          <div className="text-center bg-white/10 rounded-xl px-3.5 py-2 border border-white/10">
            <span className="block text-3xl font-black leading-none">
              {diasRestantes}
            </span>
            <span className="text-[9px] font-medium tracking-wide uppercase opacity-80 block mt-1">
              días para irte
            </span>
          </div>
        </div>

        {/* Info Check-in / Check-out */}
        <div className="grid grid-cols-7 items-center bg-white/5 border border-white/10 rounded-xl p-3 text-center">
          <div className="col-span-3 text-left pl-1">
            <div className="flex items-center gap-1 opacity-70 text-[9px] font-bold uppercase tracking-wider mb-0.5">
              <Sunrise className="w-3 h-3" /> Check-in
            </div>
            <p className="text-sm font-bold truncate">
              {fmt(proxima.fecha_inicio, {
                weekday: "short",
                day: "numeric",
                month: "short",
              })}
            </p>
          </div>
          <div className="col-span-1 flex flex-col items-center justify-center gap-0.5 opacity-80">
            <Plane className="w-4 h-4 rotate-45 text-primary-foreground/90" />
            <span className="text-[9px] font-semibold tracking-tight">
              {noches} {noches === 1 ? "noche" : "noches"}
            </span>
          </div>
          <div className="col-span-3 text-right pr-1">
            <div className="flex items-center justify-end gap-1 opacity-70 text-[9px] font-bold uppercase tracking-wider mb-0.5">
              <Sunset className="w-3 h-3" /> Check-out
            </div>
            <p className="text-sm font-bold truncate">
              {fmt(proxima.fecha_fin, {
                weekday: "short",
                day: "numeric",
                month: "short",
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Countdown Badge */}
      <div className="px-5 pt-4">
        <div
          className={`flex items-center justify-center gap-2 border rounded-lg py-2 px-3 text-xs font-semibold ${urgencia.className}`}
        >
          <Timer className="w-3.5 h-3.5 shrink-0" />
          <span>{urgencia.label}</span>
        </div>
      </div>

      {/* Matriz del Calendario */}
      <div className="p-5">
        <div className="flex items-center justify-between mb-4 border-b border-border/60 pb-2">
          <span className="text-sm font-bold text-foreground capitalize">
            {monthName}
          </span>
          <div className="flex gap-3 text-[10px] font-medium text-muted-foreground">
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-primary" />{" "}
              <span>Inicio</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />{" "}
              <span>Fin</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-2 rounded bg-primary/10 border border-primary/20" />{" "}
              <span>Estancia</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-7 text-center mb-2">
          {["D", "L", "M", "X", "J", "V", "S"].map((d) => (
            <span
              key={d}
              className="text-[10px] font-bold text-muted-foreground/60"
            >
              {d}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-y-1.5 justify-items-center text-center">
          {Array.from({ length: firstDay }).map((_, i) => (
            <span key={`e-${i}`} className="w-8 h-8" />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const isIn = day === checkIn;
            const isOut = day === checkOut;
            const inRange = day > checkIn && day < checkOut;
            const isHoy =
              esEsteMes && day === hoyDia && !isIn && !isOut && !inRange;

            let cellClass =
              "w-8 h-8 flex items-center justify-center text-xs rounded-full transition-all relative text-muted-foreground ";

            if (isIn)
              cellClass +=
                "bg-primary text-primary-foreground font-bold shadow-sm";
            else if (isOut)
              cellClass += "bg-cyan-500 text-white font-bold shadow-sm";
            else if (inRange)
              cellClass +=
                "bg-primary/10 text-primary font-medium rounded-md w-full";
            else if (isHoy)
              cellClass += "ring-2 ring-primary text-primary font-bold";
            else cellClass += "hover:bg-muted text-foreground";

            return (
              <span key={day} className={cellClass}>
                {day}
                {(isIn || isOut) && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white/60" />
                )}
              </span>
            );
          })}
        </div>

        {/* Mini Stats Inferiores */}
        <div className="grid grid-cols-3 gap-3 mt-5">
          {[
            {
              icon: Moon,
              label: "Noches",
              value: noches,
              color: "text-primary bg-primary/5 border-primary/10",
            },
            {
              icon: Users,
              label: "Viajeros",
              value: proxima.numero_personas ?? "–",
              color: "text-cyan-500 bg-cyan-500/5 border-cyan-500/10",
            },
            {
              icon: Timer,
              label: "Faltan",
              value: `${diasRestantes}d`,
              color:
                diasRestantes <= 3
                  ? "text-amber-500 bg-amber-500/5 border-amber-500/10"
                  : "text-green-500 bg-green-500/5 border-green-500/10",
            },
          ].map((s) => (
            <div
              key={s.label}
              className={`border rounded-xl p-3 text-center transition-colors ${s.color}`}
            >
              <s.icon className="w-3.5 h-3.5 mx-auto mb-1 opacity-80" />
              <p className="text-base font-bold tracking-tight leading-none">
                {s.value}
              </p>
              <p className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider mt-1.5">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Section Header ─────────────────────────────────────────────────────────
function SectionHeader({
  title,
  subtitle,
  icon: Icon,
}: {
  title: string;
  subtitle?: string;
  icon: any;
}) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-9 h-9 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div>
        <h2 className="text-base font-bold text-foreground tracking-tight leading-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

// ── Filtro de reservas ─────────────────────────────────────────────────────
type FiltroEstado =
  | "todas"
  | "confirmada"
  | "pendiente"
  | "finalizada"
  | "cancelada";

const filtroOpciones: {
  value: FiltroEstado;
  label: string;
  icon: any;
  activeClass: string;
}[] = [
  {
    value: "todas",
    label: "Todas",
    icon: Filter,
    activeClass: "bg-primary text-primary-foreground border-primary",
  },
  {
    value: "confirmada",
    label: "Confirmadas",
    icon: CheckCircle,
    activeClass:
      "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30",
  },
  {
    value: "pendiente",
    label: "Pendientes",
    icon: AlertCircle,
    activeClass:
      "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
  },
  {
    value: "finalizada",
    label: "Finalizadas",
    icon: Plane,
    activeClass: "bg-muted text-foreground border-border",
  },
  {
    value: "cancelada",
    label: "Canceladas",
    icon: XCircle,
    activeClass: "bg-destructive/10 text-destructive border-destructive/30",
  },
];

function FiltroBar({
  filtro,
  setFiltro,
  busqueda,
  setBusqueda,
  counts,
}: {
  filtro: FiltroEstado;
  setFiltro: (f: FiltroEstado) => void;
  busqueda: string;
  setBusqueda: (s: string) => void;
  counts: Record<FiltroEstado, number>;
}) {
  return (
    <div className="space-y-3 mb-5">
      {/* Buscador */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60 pointer-events-none" />
        <input
          type="text"
          placeholder="Buscar por código de paquete, reserva o fechas..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full pl-10 pr-4 py-2 text-sm bg-muted/30 border border-border text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground/50"
        />
      </div>

      {/* Pills */}
      <div className="flex gap-2 flex-wrap">
        {filtroOpciones.map((op) => {
          const active = filtro === op.value;
          const count = counts[op.value];
          return (
            <button
              key={op.value}
              onClick={() => setFiltro(op.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all duration-150 cursor-pointer
                ${active ? op.activeClass : "bg-card border-border text-muted-foreground hover:bg-muted hover:text-foreground"}`}
            >
              <op.icon className="w-3.5 h-3.5" />
              <span>{op.label}</span>
              <span
                className={`text-[10px] font-bold rounded-full px-1.5 py-0.5 ml-0.5 ${active ? "bg-foreground/10 text-inherit" : "bg-muted text-muted-foreground"}`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Componente Principal ───────────────────────────────────────────────────
interface Props {
  reservas: any[];
  loading: boolean;
  reservaExpandida: number | null;
  setReservaExpandida: (id: number | null) => void;
  clienteData: ClienteResponse | null;
}

export default function TabReservas({
  reservas,
  loading,
  reservaExpandida,
  setReservaExpandida,
  clienteData,
}: Props) {
  const [modalReserva, setModalReserva] = useState<any | null>(null);
  const [modalResena, setModalResena] = useState<any | null>(null);
  const [solicitadas, setSolicitadas] = useState<Record<number, string>>({});
  const [filtro, setFiltro] = useState<FiltroEstado>("todas");
  const [busqueda, setBusqueda] = useState("");

  const handleCancelacionConfirmada = (id: number, motivo: string) =>
    setSolicitadas((prev) => ({ ...prev, [id]: motivo }));

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const proxima = useMemo(
    () =>
      reservas
        .filter(
          (r) => r.estado !== "cancelada" && new Date(r.fecha_inicio) >= hoy,
        )
        .sort(
          (a, b) =>
            new Date(a.fecha_inicio).getTime() -
            new Date(b.fecha_inicio).getTime(),
        )[0],
    [reservas],
  );

  const diasRestantes = proxima
    ? Math.ceil(
        (new Date(proxima.fecha_inicio).getTime() - hoy.getTime()) / 86400000,
      )
    : null;

  const counts: Record<FiltroEstado, number> = useMemo(
    () => ({
      todas: reservas.length,
      confirmada: reservas.filter((r) => r.estado === "confirmada").length,
      pendiente: reservas.filter((r) => r.estado === "pendiente").length,
      finalizada: reservas.filter((r) => r.estado === "finalizada").length,
      cancelada: reservas.filter((r) => r.estado === "cancelada").length,
    }),
    [reservas],
  );

  const reservasFiltradas = useMemo(() => {
    let lista =
      filtro === "todas"
        ? reservas
        : reservas.filter((r) => r.estado === filtro);
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      lista = lista.filter(
        (r) =>
          String(r.id_reserva).includes(q) ||
          String(r.id_paquete).includes(q) ||
          fmt(r.fecha_inicio).toLowerCase().includes(q) ||
          fmt(r.fecha_fin).toLowerCase().includes(q),
      );
    }
    return lista;
  }, [reservas, filtro, busqueda]);

  return (
    <>
      <AnimatePresence>
        {modalReserva && (
          <ModalCancelacion
            reserva={modalReserva}
            onClose={() => setModalReserva(null)}
            onConfirm={handleCancelacionConfirmada}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modalResena && (
          <ModalResena
            reserva={modalResena}
            onClose={() => setModalResena(null)}
          />
        )}
      </AnimatePresence>

      {/* Header General */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight text-white">
          Mis Reservas
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Monitorea y gestiona el estado de tus itinerarios contratados
        </p>
      </div>

      {loading ? (
        <div className="bg-card text-card-foreground border border-border rounded-xl p-12 text-center shadow-sm">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            Sincronizando tus itinerarios...
          </p>
        </div>
      ) : reservas.length === 0 ? (
        <div className="bg-card text-card-foreground border border-border rounded-xl p-12 text-center shadow-sm">
          <Plane className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-foreground tracking-tight">
            Aún no registras reservas
          </h3>
          <p className="text-sm text-muted-foreground mb-5 max-w-xs mx-auto">
            Tus paquetes adquiridos aparecerán reflejados en esta sección para
            su gestión.
          </p>
          <Link
            to="/search"
            className="inline-block px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-95 transition-all shadow-sm"
          >
            Explorar Catálogo
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {/* ══ Resumen de métricas ══ */}
          <section>
            <SectionHeader
              title="Métricas del perfil"
              subtitle="Resumen volumétrico de solicitudes"
              icon={TrendingUp}
            />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                {
                  label: "Total Procesadas",
                  value: counts.todas,
                  color: "text-primary border-primary/20 bg-primary/5",
                  icon: TrendingUp,
                },
                {
                  label: "Confirmadas",
                  value: counts.confirmada,
                  color:
                    "text-green-600 dark:text-green-400 border-green-500/20 bg-green-500/5",
                  icon: CheckCircle,
                },
                {
                  label: "En Espera",
                  value: counts.pendiente,
                  color:
                    "text-amber-600 dark:text-amber-400 border-amber-500/20 bg-amber-500/5",
                  icon: Clock,
                },
                {
                  label: "Canceladas",
                  value: counts.cancelada,
                  color:
                    "text-destructive border-destructive/20 bg-destructive/5",
                  icon: Ban,
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className={`border rounded-xl p-4 text-center transition-all ${s.color}`}
                >
                  <s.icon className="w-4 h-4 mx-auto mb-1 opacity-75" />
                  <p className="text-2xl font-extrabold tracking-tight leading-none">
                    {s.value}
                  </p>
                  <p className="text-[10px] font-medium opacity-80 uppercase tracking-wider mt-1.5">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* ══ Calendario Próximo Viaje ══ */}
          {proxima && diasRestantes !== null && (
            <section>
              <SectionHeader
                title="Cronograma más cercano"
                subtitle="Control de tiempo real para tu próximo servicio"
                icon={Plane}
              />
              <CalendarioViaje
                proxima={proxima}
                diasRestantes={diasRestantes}
              />
            </section>
          )}

          {/* ══ Listado Completo ══ */}
          <section>
            <SectionHeader
              title="Historial de Reservas"
              subtitle={`${counts.todas} solicitud${counts.todas !== 1 ? "es" : ""} registrada${counts.todas !== 1 ? "as" : ""}`}
              icon={Calendar}
            />

            <FiltroBar
              filtro={filtro}
              setFiltro={setFiltro}
              busqueda={busqueda}
              setBusqueda={setBusqueda}
              counts={counts}
            />

            {reservasFiltradas.length === 0 ? (
              <div className="bg-card text-card-foreground border border-border rounded-xl p-8 text-center">
                <Search className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm font-semibold text-muted-foreground">
                  No se encontraron resultados coincidentes
                </p>
                <p className="text-xs text-muted-foreground/60 mt-0.5">
                  Prueba reajustando los criterios de búsqueda o filtros.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {reservasFiltradas.map((reserva) => {
                    const estadoMostrar = solicitadas[reserva.id_reserva]
                      ? "cancelacion_solicitada"
                      : reserva.estado;
                    const config =
                      estadoConfig[estadoMostrar] ?? estadoConfig.pendiente;
                    const Icon = config.icon;
                    const expanded = reservaExpandida === reserva.id_reserva;
                    const noches = nights(
                      reserva.fecha_inicio,
                      reserva.fecha_fin,
                    );
                    const yaSolicitada =
                      !!solicitadas[reserva.id_reserva] ||
                      reserva.estado === "cancelacion_solicitada" ||
                      reserva.estado === "cancelada";

                    return (
                      <motion.div
                        key={reserva.id_reserva}
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
                                $
                                {Number(
                                  reserva.precio_total ?? 0,
                                ).toLocaleString("es-CO")}{" "}
                                COP
                              </span>
                            </div>
                          </div>

                          {/* Acciones principales */}
                          <div className="flex flex-wrap items-center justify-between border-t border-border/60 pt-4 gap-2">
                            <div className="flex items-center gap-2">
                              {/* CORRECCIÓN: Permitir descarga si está confirmada O pendiente, y ajustar props */}
                              {clienteData &&
                                (reserva.estado === "confirmada" ||
                                  reserva.estado === "pendiente") && (
                                  <ComprobantePDF
                                    reservaId={reserva.id_reserva}
                                    clienteData={clienteData}
                                  />
                                )}

                              {!yaSolicitada &&
                                reserva.estado !== "finalizada" && (
                                  <button
                                    onClick={() => setModalReserva(reserva)}
                                    className="px-3 py-1.5 border border-destructive/30 text-destructive text-xs font-medium rounded-lg hover:bg-destructive/5 transition-all cursor-pointer"
                                  >
                                    Solicitar Cancelación
                                  </button>
                                )}

                              <button
                                onClick={() => setModalResena(reserva)}
                                className="px-3 py-1.5 border border-primary/30 text-primary text-xs font-medium rounded-lg hover:bg-primary/5 transition-all cursor-pointer"
                              >
                                Dejar reseña
                              </button>
                            </div>

                            <button
                              onClick={() =>
                                setReservaExpandida(
                                  expanded ? null : reserva.id_reserva,
                                )
                              }
                              className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors py-1.5 cursor-pointer"
                            >
                              <span>
                                {expanded
                                  ? "Ocultar especificaciones"
                                  : "Ver especificaciones"}
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
                                      Detalles del itinerario hotelero,
                                      locaciones de check-in y asignaciones de
                                      cupos incluidos dentro de la tarifa.
                                    </p>
                                  </div>
                                  <div className="space-y-2">
                                    <h4 className="font-bold text-foreground text-xs uppercase tracking-wider text-muted-foreground/90">
                                      Políticas de Modificación
                                    </h4>
                                    <p className="text-muted-foreground">
                                      Toda alteración en las fechas de estancia
                                      o variaciones en el número de pasajeros
                                      declarados debe tramitarse con 5 días
                                      hábiles de anticipación.
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </section>
        </div>
      )}
    </>
  );
}
