import { Plane, Sunrise, Sunset } from "lucide-react";
import { fmt } from "../utils";

interface Props {
  proxima: any;
  diasRestantes: number;
  noches: number;
}

export default function HeaderResumen({ proxima, diasRestantes, noches }: Props) {
  return (
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
  );
}