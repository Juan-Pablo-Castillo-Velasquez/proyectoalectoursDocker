import { Moon, Timer, Users } from "lucide-react";
import { EstadoViaje } from "../utils";

interface Props {
  proxima: any;
  diasRestantes: number;
  noches: number;
  estadoViaje: EstadoViaje;
}

export default function StatsResumen({
  proxima,
  diasRestantes,
  noches,
  estadoViaje,
}: Props) {
  const faltanLabel =
    estadoViaje === "en_curso"
      ? "En curso"
      : estadoViaje === "finalizado"
        ? "Finalizado"
        : estadoViaje === "hoy"
          ? "Hoy"
          : `${diasRestantes}d`;

  const faltanColor =
    estadoViaje === "en_curso"
      ? "text-cyan-500 bg-cyan-500/5 border-cyan-500/10"
      : estadoViaje === "finalizado"
        ? "text-muted-foreground bg-muted/40 border-border"
        : diasRestantes <= 3
          ? "text-amber-500 bg-amber-500/5 border-amber-500/10"
          : "text-green-500 bg-green-500/5 border-green-500/10";

  const stats = [
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
      value: faltanLabel,
      color: faltanColor,
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3 mt-5">
      {stats.map((s) => (
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
  );
}