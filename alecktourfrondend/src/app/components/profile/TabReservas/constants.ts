import {
  AlertCircle,
  CheckCircle,
  Clock,
  Filter,
  Plane,
  XCircle,
} from "lucide-react";

export const estadoConfig: Record<
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
    color: "text-primary border-primary/20",
    bg: "bg-primary/10",
    icon: Clock,
    label: "Cancelación en trámite",
  },
};

export const MOTIVOS = [
  "Cambio de planes personales",
  "Problema económico",
  "Emergencia médica o familiar",
  "Error al hacer la reserva",
  "Encontré una mejor opción",
  "Otro motivo",
];

export type FiltroEstado =
  | "todas"
  | "confirmada"
  | "pendiente"
  | "finalizada"
  | "cancelada";

export const filtroOpciones: {
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