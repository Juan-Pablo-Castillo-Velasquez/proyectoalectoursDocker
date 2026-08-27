import { useState } from "react";
import {
  Search, Trash2, Wallet, CheckCircle, Clock, XCircle, CreditCard,
  Pencil, AlertCircle, Save,
} from "lucide-react";
import { Pago, Reserva, Cliente, labelCls } from "./types";
import AdminModal from "./ui/AdminModal";
import StatCard from "./ui/StatCard";
import SectionHeader from "./ui/SectionHeader";
import StatusBadge from "./ui/StatusBadge";
import EmptyState from "./ui/EmptyState";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../ui/select";

// Forma real de GET /metodos-pago (MetodoPagoResponse en reserva_schema.py)
// — opcional: si Admindashboard no la pasa, el filtro de método se arma
// igual a partir de los métodos que ya vienen embebidos en cada pago.
export interface MetodoPago {
  id_metodo: number;
  nombre_metodo: string;
  codigo: string;
}

const PAGO_ESTADOS = ["pendiente", "procesando", "pagado", "rechazado", "cancelado"] as const;
type PagoEstado = typeof PAGO_ESTADOS[number];
type EstadoFilter = "todos" | PagoEstado;

// fecha_pago SÍ trae hora real (datetime, no una fecha "pura" como
// fecha_inicio/fecha_fin de Reserva) — se puede pasar por Date() sin
// riesgo de corrimiento de día.
function formatFechaHora(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("es-CO", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const ESTADO_ICON: Record<PagoEstado, React.ReactNode> = {
  pendiente: <Clock className="w-3.5 h-3.5" />,
  procesando: <Clock className="w-3.5 h-3.5" />,
  pagado: <CheckCircle className="w-3.5 h-3.5" />,
  rechazado: <XCircle className="w-3.5 h-3.5" />,
  cancelado: <XCircle className="w-3.5 h-3.5" />,
};

interface Props {
  pagos: Pago[];
  reservas?: Reserva[];
  clientes?: Cliente[];
  metodos?: MetodoPago[];
  onUpdateEstado: (id: number, estado: PagoEstado) => Promise<void>;
  onDelete: (id: number) => void;
}

// Centro de pagos del admin: KPIs reales (recaudado, pendientes, rechazados
// — todo calculado sobre `pagos`, nada inventado), tabla filtrable y edición
// de estado. Deliberadamente NO hay formulario de "crear pago nuevo": un
// pago real solo debe originarse del flujo de pago del cliente
// (pagar_reserva / confirmar_pago en reserva_route.py). Dejar que un admin
// cree pagos a mano desde acá podría producir registros financieramente
// inconsistentes (montos que no cuadran con ninguna reserva real), lo cual
// choca con el mismo principio de "no fabricar datos" — aunque POST /pagos
// exista como endpoint técnico.
export default function ModulePagos({
  pagos, reservas = [], clientes = [], metodos = [], onUpdateEstado, onDelete,
}: Props) {
  const [search, setSearch] = useState("");
  const [estadoFilter, setEstadoFilter] = useState<EstadoFilter>("todos");
  const [metodoFilter, setMetodoFilter] = useState("todos");
  const [editing, setEditing] = useState<Pago | null>(null);
  const [nuevoEstado, setNuevoEstado] = useState<PagoEstado>("pendiente");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const reservaMap = Object.fromEntries(reservas.map(r => [r.id_reserva, r]));
  const clienteMap = Object.fromEntries(clientes.map(c => [c.id_cliente, c]));

  // Lista de métodos para el filtro: la real (si llegó por props) o, si no,
  // los que ya aparecen en los pagos cargados — nunca una lista inventada.
  const metodosFiltro = metodos.length > 0
    ? metodos.map(m => m.nombre_metodo)
    : Array.from(new Set(pagos.map(p => p.metodo_pago?.nombre_metodo).filter((n): n is string => !!n)));

  const filtered = pagos.filter(p => {
    const reserva = reservaMap[p.id_reserva];
    const cliente = reserva ? clienteMap[reserva.id_cliente] : undefined;
    const q = search.toLowerCase();
    const matchEstado = estadoFilter === "todos" || p.estado === estadoFilter;
    const matchMetodo = metodoFilter === "todos" || p.metodo_pago?.nombre_metodo === metodoFilter;
    const matchSearch = !q
      || String(p.id_pago).includes(q)
      || String(p.id_reserva).includes(q)
      || (p.referencia ?? "").toLowerCase().includes(q)
      || (cliente && `${cliente.nombre} ${cliente.apellido}`.toLowerCase().includes(q));
    return matchEstado && matchMetodo && matchSearch;
  });

  const hasActiveFilters = estadoFilter !== "todos" || metodoFilter !== "todos" || search.trim() !== "";
  function clearFilters() { setSearch(""); setEstadoFilter("todos"); setMetodoFilter("todos"); }

  // KPIs reales — nunca un porcentaje o total inventado, solo agregaciones
  // sobre el arreglo `pagos` que ya llega del backend.
  const recaudado = pagos.filter(p => p.estado === "pagado").reduce((sum, p) => sum + p.monto, 0);
  const pendientes = pagos.filter(p => p.estado === "pendiente" || p.estado === "procesando").length;
  const rechazados = pagos.filter(p => p.estado === "rechazado" || p.estado === "cancelado").length;

  function openEdit(p: Pago) {
    setEditing(p);
    setNuevoEstado(p.estado as PagoEstado);
    setSaveError("");
  }
  function closeEdit() { setEditing(null); setSaveError(""); }

  async function handleSaveEstado() {
    if (!editing) return;
    setSaving(true); setSaveError("");
    try {
      await onUpdateEstado(editing.id_pago, nuevoEstado);
      closeEdit();
    } catch {
      setSaveError("No se pudo actualizar el estado del pago");
    } finally {
      setSaving(false);
    }
  }

  const thCls = "px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap";
  const selectTriggerCls = "w-auto min-w-[140px] h-auto py-2 bg-card border-border text-xs";

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Pagos"
        subtitle={`${pagos.length} pago${pagos.length === 1 ? "" : "s"} registrado${pagos.length === 1 ? "" : "s"}`}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total"      value={pagos.length}                                icon={Wallet}     />
        <StatCard label="Recaudado"  value={`$${recaudado.toLocaleString("es-CO")}`}      icon={CheckCircle} gradient="from-emerald-500 to-emerald-600" />
        <StatCard label="Pendientes" value={pendientes}                                   icon={Clock}       gradient="from-[#C9A227] to-[#C9A227]" />
        <StatCard label="Rechazados" value={rechazados}                                   icon={XCircle}     gradient="from-destructive to-destructive" />
      </div>

      <div className="flex items-center gap-2.5 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por reserva, cliente o referencia..."
            className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl text-sm outline-none
              bg-card text-foreground placeholder:text-muted-foreground/60
              focus:ring-2 focus:ring-primary/40 focus:border-transparent"
          />
        </div>

        <Select value={estadoFilter} onValueChange={(v) => setEstadoFilter(v as EstadoFilter)}>
          <SelectTrigger className={selectTriggerCls}>
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            <SelectItem value="todos">Estado: todos</SelectItem>
            {PAGO_ESTADOS.map(e => (
              <SelectItem key={e} value={e} className="capitalize">{e}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {metodosFiltro.length > 0 && (
          <Select value={metodoFilter} onValueChange={setMetodoFilter}>
            <SelectTrigger className={selectTriggerCls}>
              <SelectValue placeholder="Método" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="todos">Método: todos</SelectItem>
              {metodosFiltro.map(m => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-destructive transition-colors"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {filtered.length > 0 ? (
        <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b border-border">
              <tr>
                <th className={thCls}>Pago</th>
                <th className={thCls}>Reserva</th>
                <th className={thCls}>Método</th>
                <th className={thCls}>Monto</th>
                <th className={thCls}>Estado</th>
                <th className={thCls}>Fecha</th>
                <th className={thCls}></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filtered.map(p => {
                const reserva = reservaMap[p.id_reserva];
                const cliente = reserva ? clienteMap[reserva.id_cliente] : undefined;
                return (
                  <tr key={p.id_pago} className="hover:bg-accent transition-colors">
                    <td className="px-4 py-3 font-semibold text-foreground whitespace-nowrap">
                      #{p.id_pago}
                      {p.referencia && (
                        <p className="text-[11px] font-normal text-muted-foreground truncate max-w-[140px]">{p.referencia}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap">
                      <p className="font-medium text-foreground">Reserva #{p.id_reserva}</p>
                      {cliente && (
                        <p className="text-[11px] text-muted-foreground">{cliente.nombre} {cliente.apellido}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 flex-shrink-0" />
                        {p.metodo_pago?.nombre_metodo ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-foreground whitespace-nowrap">
                      ${p.monto.toLocaleString("es-CO")}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={p.estado} />
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {formatFechaHora(p.fecha_pago)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => openEdit(p)}
                          className="p-1.5 text-primary/60 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                          title="Cambiar estado"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDelete(p.id_pago)}
                          className="p-1.5 text-destructive/60 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all"
                          title="Eliminar pago"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          icon={Search}
          title="No se encontraron pagos"
          description={pagos.length === 0 ? "Todavía no hay pagos registrados." : "Prueba con otros filtros o términos de búsqueda."}
          action={hasActiveFilters ? (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-2 bg-muted hover:bg-muted/70 text-foreground rounded-lg text-xs font-medium transition-colors"
            >
              Limpiar filtros
            </button>
          ) : undefined}
        />
      )}

      {/* Editar estado de un pago */}
      <AdminModal
        open={!!editing}
        onOpenChange={(o) => { if (!o) closeEdit(); }}
        title={editing ? `Pago #${editing.id_pago}` : ""}
        description={editing ? `Reserva #${editing.id_reserva} · $${editing.monto.toLocaleString("es-CO")}` : undefined}
        maxWidth="sm:max-w-sm"
      >
        {editing && (
          <div className="space-y-3">
            <label className={labelCls}>Estado del pago</label>
            <div className="grid grid-cols-2 gap-1.5">
              {PAGO_ESTADOS.map(e => (
                <button
                  key={e}
                  onClick={() => setNuevoEstado(e)}
                  className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg border text-xs font-medium capitalize transition-all
                    ${nuevoEstado === e
                      ? "border-primary/40 bg-primary/10 text-primary ring-2 ring-primary/30 ring-offset-1 ring-offset-card"
                      : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground"
                    }`}
                >
                  {ESTADO_ICON[e]}
                  {e}
                </button>
              ))}
            </div>
            {saveError && (
              <p className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {saveError}
              </p>
            )}
            <button
              onClick={handleSaveEstado}
              disabled={saving || nuevoEstado === editing.estado}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all
                bg-gradient-to-r from-primary to-[#A13B55] text-white hover:shadow-lg hover:shadow-primary/20 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? "Guardando..." : "Guardar cambio de estado"}
            </button>
          </div>
        )}
      </AdminModal>
    </div>
  );
}
