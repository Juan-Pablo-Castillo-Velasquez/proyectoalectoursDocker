import { ArrowUpRight } from "lucide-react";
import type { ComponentType, ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ComponentType<{ className?: string }>;
  /** Clases tailwind del degradado del ícono, ej: "from-primary to-[#A13B55]" */
  gradient?: string;
  sub?: ReactNode;
  subColor?: string;
  onClick?: () => void;
}

// KPI card reutilizable — generaliza el patrón que ya usaba ModuleDashboard
// (icono con degradado + valor grande + etiqueta + dato secundario) para que
// cualquier módulo nuevo (Cancelaciones, Empresas, Pagos...) muestre sus
// propios números reales con la misma presentación, sin copiar el markup.
export default function StatCard({
  label,
  value,
  icon: Icon,
  gradient = "from-primary to-[#A13B55]",
  sub,
  subColor = "text-muted-foreground",
  onClick,
}: StatCardProps) {
  const Comp = (onClick ? "button" : "div") as any;

  return (
    <Comp
      onClick={onClick}
      className={`bg-card rounded-2xl p-5 shadow-sm border border-border hover:shadow-md transition-shadow text-left w-full ${
        onClick ? "cursor-pointer" : ""
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm`}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>
        {onClick && <ArrowUpRight className="w-4 h-4 text-muted-foreground" />}
      </div>
      <p className="text-3xl font-bold text-foreground mb-0.5">{value}</p>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      {sub && <p className={`text-xs mt-1 font-medium ${subColor}`}>{sub}</p>}
    </Comp>
  );
}
