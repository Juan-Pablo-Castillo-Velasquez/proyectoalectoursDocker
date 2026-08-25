import { Timer } from "lucide-react";
import { EstadoViaje } from "../utils";

interface Props {
  diasRestantes: number;
  estadoViaje: EstadoViaje;
}

export default function UrgenciaBadge({ diasRestantes, estadoViaje }: Props) {
  const urgencia =
    estadoViaje === "en_curso"
      ? {
          label: "Viaje en curso — ¡disfruta tu itinerario! 🧳",
          className:
            "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
        }
      : estadoViaje === "finalizado"
        ? {
            label: "Este viaje ya finalizó",
            className: "bg-muted/80 text-muted-foreground border-border",
          }
        : estadoViaje === "hoy"
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
    <div className="px-5 pt-4">
      <div
        className={`flex items-center justify-center gap-2 border rounded-lg py-2 px-3 text-xs font-semibold ${urgencia.className}`}
      >
        <Timer className="w-3.5 h-3.5 shrink-0" />
        <span>{urgencia.label}</span>
      </div>
    </div>
  );
}