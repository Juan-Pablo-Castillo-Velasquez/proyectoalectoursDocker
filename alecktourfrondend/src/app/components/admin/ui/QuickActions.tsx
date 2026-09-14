import type { ComponentType } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../ui/tooltip";

export interface QuickAction {
  label: string;
  icon: ComponentType<{ className?: string }>;
  onClick: () => void;
}

interface QuickActionsProps {
  actions: QuickAction[];
}

// Accesos rápidos del header del admin (nueva reserva, registrar hotel,
// etc.) — antes vivían escondidos detrás de un botón "+ Acción rápida" que
// había que abrir para ver cuáles eran; ahora cada uno es su propio botón
// visible en el header, con su nombre solo al pasar el mouse (Tooltip, ya
// usado con el mismo criterio en AdminSidebar.tsx) para no llenar la barra
// de texto. Se ocultan por debajo de `sm` (igual que el buscador/breadcrumb
// se ocultan por debajo de `md`) para no desbordar el header en celular.
export default function QuickActions({ actions }: QuickActionsProps) {
  if (!actions.length) return null;

  return (
    <div className="hidden sm:flex items-center gap-1">
      {actions.map((a) => (
        <Tooltip key={a.label}>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={a.onClick}
              aria-label={a.label}
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all"
            >
              <a.icon className="w-5 h-5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">{a.label}</TooltipContent>
        </Tooltip>
      ))}

      {/* Separador sutil para distinguir el grupo de accesos rápidos del
          resto de íconos del header (campana, tema, cuenta). */}
      <div className="w-px h-6 bg-white/20 mx-1" />
    </div>
  );
}
