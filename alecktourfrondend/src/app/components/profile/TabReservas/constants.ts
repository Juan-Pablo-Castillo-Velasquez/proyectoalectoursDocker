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
    color: "text-success border-success/20",
    bg: "bg-success/10",
    icon: CheckCircle,
    label: "Confirmada",
  },
  pendiente: {
    color: "text-warning border-warning/20",
    bg: "bg-warning/10",
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
      "bg-success/10 text-success border-success/30",
  },
  {
    value: "pendiente",
    label: "Pendientes",
    icon: AlertCircle,
    activeClass:
      "bg-warning/10 text-warning border-warning/30",
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