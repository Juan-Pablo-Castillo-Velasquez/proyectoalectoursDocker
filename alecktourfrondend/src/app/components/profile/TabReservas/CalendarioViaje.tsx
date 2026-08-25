import { Moon, Plane, Sunrise, Sunset, Timer, Users } from "lucide-react";
import { fmt, nights } from "./utils";

interface Props {
  proxima: any;
  diasRestantes: number;
}

export default function CalendarioViaje({ proxima, diasRestantes }: Props) {
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