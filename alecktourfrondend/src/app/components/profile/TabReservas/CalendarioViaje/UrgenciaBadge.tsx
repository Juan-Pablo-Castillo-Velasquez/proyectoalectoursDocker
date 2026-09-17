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
            "bg-gold/10 text-gold border-gold/20",
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
                "bg-success/10 text-success border-success/20",
            }
          : diasRestantes <= 3
            ? {
                label: `¡Atención, faltan solo ${diasRestantes} días!`,
                className:
                  "bg-warning/10 text-warning border-warning/20",
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