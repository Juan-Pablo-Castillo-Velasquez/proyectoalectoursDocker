import { Search } from "lucide-react";
import { FiltroEstado, filtroOpciones } from "./constants";

interface Props {
  filtro: FiltroEstado;
  setFiltro: (f: FiltroEstado) => void;
  busqueda: string;
  setBusqueda: (s: string) => void;
  counts: Record<FiltroEstado, number>;
}

export default function FiltroBar({
  filtro,
  setFiltro,
  busqueda,
  setBusqueda,
  counts,
}: Props) {
  return (
    <div className="space-y-3 mb-5">
      {/* Buscador */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60 pointer-events-none" />
        <input
          type="text"
          placeholder="Buscar por código de paquete, reserva o fechas..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full pl-10 pr-4 py-2 text-sm bg-muted/30 border border-border text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground/50"
        />
      </div>

      {/* Pills */}
      <div className="flex gap-2 flex-wrap">
        {filtroOpciones.map((op) => {
          const active = filtro === op.value;
          const count = counts[op.value];
          return (
            <button
              key={op.value}
              onClick={() => setFiltro(op.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all duration-150 cursor-pointer
                ${active ? op.activeClass : "bg-card border-border text-muted-foreground hover:bg-muted hover:text-foreground"}`}
            >
              <op.icon className="w-3.5 h-3.5" />
              <span>{op.label}</span>
              <span
                className={`text-[10px] font-bold rounded-full px-1.5 py-0.5 ml-0.5 ${active ? "bg-foreground/10 text-inherit" : "bg-muted text-muted-foreground"}`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}