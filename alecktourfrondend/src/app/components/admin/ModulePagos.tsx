import { useState, useEffect } from "react";
import {
  Search, Trash2, Wallet, CheckCircle, Clock, XCircle, CreditCard,
  Pencil, AlertCircle, Save, FileText, Paperclip, Upload,
  Mail, Phone, User, ArrowUpRight,
} from "lucide-react";
import { Pago, Reserva, Cliente, labelCls, resolveFotoUrl } from "./types";
import { generarFacturaPdf } from "../../utils/generarFacturaPdf";
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
  onUploadComprobante?: (id: number, file: File) => Promise<void>;
  onDeleteComprobante?: (id: number) => Promise<void>;
  /** Abre el detalle completo de la reserva vinculada en el módulo de
   * Reservas (mismo mecanismo que "Ver reserva completa" en Cancelaciones,
   * ver `reservaIdInicial` en ModuleReservas.tsx) — antes no había forma de
   * pasar de un pago a su reserva sin buscarla manualmente. */
  onVerReserva?: (id: number) => void;
  /** Mismo criterio que `reservaIdInicial` en ModuleReservas.tsx: cuando el
   * Dashboard navega acá desde una tarjeta de KPI (ej. "Pagos pendientes"),
   * deja el filtro de estado pre-aplicado. */
  estadoInicial?: string | null;
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
  onUploadComprobante, onDeleteComprobante, onVerReserva, estadoInicial = null,
}: Props) {
  const [search, setSearch] = useState("");
  const [estadoFilter, setEstadoFilter] = useState<EstadoFilter>("todos");

  // Ver comentario de `estadoInicial` en Props.
  useEffect(() => {
    if (estadoInicial && (PAGO_ESTADOS as readonly string[]).includes(estadoInicial)) {
      setEstadoFilter(estadoInicial as EstadoFilter);
    }
  }, [estadoInicial]);
  const [metodoFilter, setMetodoFilter] = useState("todos");
  const [editing, setEditing] = useState<Pago | null>(null);
  const [nuevoEstado, setNuevoEstado] = useState<PagoEstado>("pendiente");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [comprobanteLoading, setComprobanteLoading] = useState(false);
  const [comprobanteError, setComprobanteError] = useState("");

  const reservaMap = Object.fromEntries(reservas.map(r => [r.id_reserva, r]));
  const clienteMap = Object.fromEntries(clientes.map(c => [c.id_cliente, c]));

  // Reserva y cliente reales del pago que está abierto en el modal de
  // edición — antes el modal no los usaba para nada aunque ya llegaban como
  // props (reservaMap/clienteMap de arriba), así que solo mostraba el
  // id_reserva plano, sin nombre/correo/celular del cliente ni forma de ir
  // a ver la reserva completa.
  const reservaEditando = editing ? reservaMap[editing.id_reserva] : undefined;
  const clienteEditando = reservaEditando ? clienteMap[reservaEditando.id_cliente] : undefined;

  // Mantiene `editing` sincronizado con la lista real: al subir/borrar un
  // comprobante o al asignarse un numero_factura, `pagos` (prop) se
  // actualiza en el padre pero `editing` seguía siendo la foto vieja del
  // momento en que se abrió el modal — sin esto, el modal no reflejaba el
  // resultado de la propia acción que el admin acababa de hacer ahí mismo.
  useEffect(() => {
    if (!editing) return;
    const fresh = pagos.find(p => p.id_pago === editing.id_pago);
    if (fresh && fresh !== editing) setEditing(fresh);
  }, [pagos, editing]);

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
    setComprobanteError("");
  }
  function closeEdit() { setEditing(null); setSaveError(""); setComprobanteError(""); }

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

  function handleDescargarFactura(p: Pago) {
    const reserva = reservaMap[p.id_reserva];
    const cliente = reserva ? clienteMap[reserva.id_cliente] : undefined;
    generarFacturaPdf(p, reserva, cliente);
  }

  async function handleUploadComprobante(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // permite volver a elegir el mismo archivo si hay que reintentar
    if (!file || !editing || !onUploadComprobante) return;
    setComprobanteLoading(true); setComprobanteError("");
    try {
      await onUploadComprobante(editing.id_pago, file);
    } catch {
      setComprobanteError("No se pudo subir el comprobante");
    } finally {
      setComprobanteLoading(false);
    }
  }

  async function handleDeleteComprobante() {
    if (!editing || !onDeleteComprobante) return;
    setComprobanteLoading(true); setComprobanteError("");
    try {
      await onDeleteComprobante(editing.id_pago);
    } catch {
      setComprobanteError("No se pudo eliminar el comprobante");
    } finally {
      setComprobanteLoading(false);
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
                        {p.numero_factura && (
                          <button
                            onClick={() => handleDescargarFactura(p)}
                            className="p-1.5 text-emerald-600/70 hover:text-emerald-600 hover:bg-emerald-500/10 rounded-lg transition-all"
                            title={`Descargar factura ${p.numero_factura}`}
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                        )}
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
            {/* Cliente real de la reserva — ya llegaba en `clientes`/`reservas`
                (props) pero nunca se mostraba acá; el nombre en la tabla era
                lo único visible sin abrir la factura en PDF. */}
            {clienteEditando && (
              <div className="p-3 rounded-xl border border-border bg-muted/30 space-y-1.5">
                <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-muted-foreground" />
                  {clienteEditando.nombre} {clienteEditando.apellido}
                </p>
                {clienteEditando.correo && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 flex-shrink-0" /> {clienteEditando.correo}
                  </p>
                )}
                {clienteEditando.celular && (
                  <a href={`tel:${clienteEditando.celular}`} className="text-xs text-muted-foreground flex items-center gap-1.5 hover:text-primary w-fit">
                    <Phone className="w-3.5 h-3.5 flex-shrink-0" /> {clienteEditando.celular}
                  </a>
                )}
                {clienteEditando.cedula && (
                  <p className="text-xs text-muted-foreground">CC {clienteEditando.cedula}</p>
                )}
                {onVerReserva && (
                  <button
                    onClick={() => onVerReserva(editing.id_reserva)}
                    className="pt-1 flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                  >
                    Ver reserva completa en Reservas <ArrowUpRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}

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

            {/* Factura: solo existe (número derivado del id_pago real) una vez
                que el pago llegó a 'pagado' — ver Pago.numero_factura. */}
            <div className="pt-3 border-t border-border">
              <label className={labelCls}>Factura</label>
              {editing.numero_factura ? (
                <button
                  onClick={() => handleDescargarFactura(editing)}
                  className="mt-1.5 w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-border text-xs font-medium text-foreground hover:border-emerald-500/40 hover:text-emerald-600 transition-all"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Descargar factura {editing.numero_factura}
                </button>
              ) : (
                <p className="mt-1.5 text-[11px] text-muted-foreground">
                  Se genera automáticamente cuando el pago queda en estado "pagado".
                </p>
              )}
            </div>

            {/* Comprobante externo: voucher de transferencia/consignación que
                el cliente envía por fuera de la plataforma (ver
                POST/DELETE /api/pagos/{id}/comprobante). */}
            <div className="pt-3 border-t border-border">
              <label className={labelCls}>Comprobante externo</label>
              {editing.comprobante_url ? (
                <div className="mt-1.5 flex items-center gap-2">
                  <a
                    href={resolveFotoUrl(editing.comprobante_url)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-border text-xs font-medium text-foreground hover:border-primary/40 hover:text-primary transition-all"
                  >
                    <Paperclip className="w-3.5 h-3.5" />
                    Ver comprobante
                  </a>
                  <button
                    onClick={handleDeleteComprobante}
                    disabled={comprobanteLoading}
                    className="p-2 text-destructive/60 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all disabled:opacity-50"
                    title="Eliminar comprobante"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="mt-1.5 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg border border-dashed border-border text-xs font-medium text-muted-foreground hover:border-primary/40 hover:text-primary transition-all cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  {comprobanteLoading ? "Subiendo..." : "Subir comprobante (JPG, PNG o PDF)"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    className="hidden"
                    disabled={comprobanteLoading}
                    onChange={handleUploadComprobante}
                  />
                </label>
              )}
              {comprobanteError && (
                <p className="mt-1.5 text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {comprobanteError}
                </p>
              )}
            </div>
          </div>
        )}
      </AdminModal>
    </div>
  );
}
