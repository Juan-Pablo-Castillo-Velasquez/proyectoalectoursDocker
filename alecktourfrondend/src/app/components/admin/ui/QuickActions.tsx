import { Plus, ChevronDown } from "lucide-react";
import type { ComponentType } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";

export interface QuickAction {
  label: string;
  icon: ComponentType<{ className?: string }>;
  onClick: () => void;
}

interface QuickActionsProps {
  actions: QuickAction[];
}

// Botón "Acción rápida" global en el header del admin — abre un menú con
// los atajos a los flujos más usados (nueva reserva, registrar hotel, etc.)
// para no depender de navegar primero al módulo correspondiente.
export default function QuickActions({ actions }: QuickActionsProps) {
  if (!actions.length) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1.5 px-3.5 py-2 bg-white/15 hover:bg-white/25 text-white rounded-xl text-sm font-semibold transition-all"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Acción rápida</span>
          <ChevronDown className="w-3.5 h-3.5 opacity-80" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 bg-popover border-border">
        <DropdownMenuLabel className="text-[11px] text-muted-foreground uppercase tracking-wide">
          Accesos rápidos
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {actions.map((a) => (
          <DropdownMenuItem key={a.label} onClick={a.onClick} className="gap-2 cursor-pointer">
            <a.icon className="w-4 h-4 text-primary" />
            {a.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
