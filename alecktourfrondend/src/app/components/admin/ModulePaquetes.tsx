import { useState } from "react";
import {
  Search, Trash2, Pencil, PlusCircle, Package, CheckCircle, CreditCard, Calendar, Hotel,
} from "lucide-react";
import { Paquete, Reserva, HotelData, inputCls, labelCls } from "./types";
import { paqueteService } from "../../services/paquete.service";
import AdminModal from "./ui/AdminModal";
import StatCard from "./ui/StatCard";
import SectionHeader from "./ui/SectionHeader";
import StatusBadge from "./ui/StatusBadge";
import EmptyState from "./ui/EmptyState";
import { Switch } from "../ui/switch";

interface HotelSeleccionado { id_hotel: number; noches_incluidas: string }

const EMPTY_FORM = {
  nombre_paquete: "", descripcion: "", duracion_dias: "1", precio_base: "", activo: true,
  // paquete_hotel ya existía en el modelo (lo usa la página pública de
  // detalle vía GET /paquetes/{id}/detalle) pero no había forma de
  // editarlo desde el admin — todo paquete nuevo quedaba sin ningún hotel
  // real asociado, lo que permitía combinaciones ilógicas en Crear Reserva
  // (un paquete de una ciudad con un hotel de otra, sin ninguna relación).
  hoteles: [] as HotelSeleccionado[],
};

type EstadoFilter = "todos" | "activo" | "inactivo";
const ESTADOS: EstadoFilter[] = ["todos", "activo", "inactivo"];

interface Props {
  paquetes: Paquete[];
  // Opcional para no romper otros usos del componente — mismo patrón que
  // `clientes?` en ModuleEmpresas.tsx. Con esto se calcula un rendimiento
  // real por paquete sin pedir ningún endpoint nuevo.
  reservas?: Reserva[];
  // Opcional: lista real de hoteles para vincular al crear/editar un
  // paquete (ver EMPTY_FORM.hoteles arriba).
  hoteles?: HotelData[];
  onDelete: (id: number) => void;
  onSubmit: (data: any, id?: number) => Promise<void>;
  loading: boolean;
}

export default function ModulePaquetes({ paquetes, reservas = [], hoteles = [], onDelete, onSubmit, loading }: Props) {
  const [search, setSearch] = useState("");
  const [estadoFilter, setEstadoFilter] = useState<EstadoFilter>("todos");
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [cargandoHoteles, setCargandoHoteles] = useState(false);

  // Rendimiento real por paquete (reservas y ventas, excluyendo canceladas)
  // calculado en el cliente a partir de `reservas`, que el dashboard ya
  // carga para otros módulos — no requiere ningún endpoint nuevo.
  // PaqueteRepository.delete ya calculaba un reservas_count parecido en el
  // backend, pero solo para bloquear el borrado; nunca se mostraba en la UI.
  const rendimientoPorPaquete = new Map<number, { total: number; activas: number; ingresos: number }>();
  for (const r of reservas) {
    const prev = rendimientoPorPaquete.get(r.id_paquete) ?? { total: 0, activas: 0, ingresos: 0 };
    prev.total += 1;
    if (r.estado !== "cancelada") {
      prev.activas += 1;
      prev.ingresos += r.precio_total ?? 0;
    }
    rendimientoPorPaquete.set(r.id_paquete, prev);
  }

  // KPIs reales — nada de porcentajes ni cifras inventadas, todo calculado
  // sobre el arreglo `paquetes` que ya llega del backend.
  const activos = paquetes.filter(p => p.activo);
  const precios = paquetes.map(p => p.precio_base).filter((n): n is number => n != null);
  const duraciones = paquetes.map(p => p.duracion_dias).filter((n): n is number => n != null);
  const precioPromedio = precios.length ? precios.reduce((a, b) => a + b, 0) / precios.length : 0;
  const duracionPromedio = duraciones.length ? duraciones.reduce((a, b) => a + b, 0) / duraciones.length : 0;

  const filtered = paquetes.filter(p => {
    const matchEstado = estadoFilter === "todos" || (estadoFilter === "activo" ? p.activo : !p.activo);
    const matchSearch = p.nombre_paquete.toLowerCase().includes(search.toLowerCase());
    return matchEstado && matchSearch;
  });

  function openCreate() { setEditingId(null); setForm(EMPTY_FORM); setMsg(null); setModalOpen(true); }

  function openEdit(p: Paquete) {
    setEditingId(p.id_paquete);
    setForm({
      nombre_paquete: p.nombre_paquete, descripcion: p.descripcion ?? "",
      duracion_dias: String(p.duracion_dias ?? 1), precio_base: String(p.precio_base ?? ""),
      activo: p.activo, hoteles: [],
    });
    setMsg(null);
    setModalOpen(true);

    // Carga los hoteles YA vinculados a este paquete (paquete_hotel) desde
    // el endpoint que ya existía para la página pública de detalle — evita
    // pedir un endpoint nuevo solo para leer lo mismo. El formulario se abre
    // de inmediato (sin bloquear en la carga) y los checkboxes se marcan
    // en cuanto llega la respuesta.
    setCargandoHoteles(true);
    paqueteService.getDetalle(p.id_paquete)
      .then((detalle) => {
        setForm((prev) => ({
          ...prev,
          hoteles: detalle.hoteles.map((h) => ({
            id_hotel: h.id_hotel,
            noches_incluidas: h.noches_incluidas != null ? String(h.noches_incluidas) : "",
          })),
        }));
      })
      .catch(() => { /* si falla, el admin igual puede editar el resto y volver a marcar los hoteles */ })
      .finally(() => setCargandoHoteles(false));
  }

  function closeModal() { setModalOpen(false); setEditingId(null); setForm(EMPTY_FORM); setMsg(null); }

  function toggleHotel(id_hotel: number) {
    setForm((prev) => {
      const yaEsta = prev.hoteles.some((h) => h.id_hotel === id_hotel);
      return {
        ...prev,
        hoteles: yaEsta
          ? prev.hoteles.filter((h) => h.id_hotel !== id_hotel)
          : [...prev.hoteles, { id_hotel, noches_incluidas: "" }],
      };
    });
  }

  function setNochesHotel(id_hotel: number, noches_incluidas: string) {
    setForm((prev) => ({
      ...prev,
      hoteles: prev.hoteles.map((h) => (h.id_hotel === id_hotel ? { ...h, noches_incluidas } : h)),
    }));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    try {
      await onSubmit(
        {
          ...form,
          duracion_dias: parseInt(form.duracion_dias),
          precio_base: parseFloat(form.precio_base),
          hoteles: form.hoteles.map((h) => ({
            id_hotel: h.id_hotel,
            noches_incluidas: h.noches_incluidas ? parseInt(h.noches_incluidas, 10) : null,
          })),
        },
        editingId ?? undefined
      );
      closeModal();
    } catch (err: any) {
      setMsg({ type: "err", text: err.message || "Error al guardar paquete" });
    }
  };

  // Reactivación rápida desde la tabla: PUT /paquetes/{id} usa
  // exclude_unset (ver update_paquete en reserva_route.py), así que mandar
  // solo { activo: true } reactiva sin tocar el resto de campos y sin pasar
  // por el modal — a diferencia de desactivar, reactivar nunca choca con
  // ninguna dependencia, así que no hace falta confirmación.
  async function handleReactivar(p: Paquete) {
    try {
      await onSubmit({ activo: true }, p.id_paquete);
    } catch {
      // El toast de error ya lo muestra el handler en Admindashboard.tsx
    }
  }

  const thCls = "px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap";

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Paquetes"
        subtitle={`${paquetes.length} paquete${paquetes.length === 1 ? "" : "s"} · ${activos.length} activo${activos.length === 1 ? "" : "s"}`}
        action={
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-[#A13B55] text-white rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-primary/20 transition-all"
          >
            <PlusCircle className="w-4 h-4" /> Nuevo paquete
          </button>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total"              value={paquetes.length}                          icon={Package} />
        <StatCard label="Activos"            value={activos.length}                           icon={CheckCircle} gradient="from-emerald-500 to-emerald-600" />
        <StatCard label="Precio promedio"    value={`$${Math.round(precioPromedio).toLocaleString()}`} icon={CreditCard} gradient="from-[#C9A227] to-[#C9A227]" />
        <StatCard label="Duración promedio"  value={`${duracionPromedio.toFixed(1)} días`}     icon={Calendar}    gradient="from-[#A13B55] to-[#A13B55]" />
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre..."
            className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl text-sm outline-none
              bg-card text-foreground placeholder:text-muted-foreground/60
              focus:ring-2 focus:ring-primary/40 focus:border-transparent"
          />
        </div>
        <div className="flex gap-1 bg-muted p-1 rounded-xl border border-border">
          {ESTADOS.map(e => (
            <button
              key={e}
              onClick={() => setEstadoFilter(e)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                estadoFilter === e ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b border-border">
              <tr>
                <th className={thCls}>Paquete</th>
                <th className={thCls}>Duración</th>
                <th className={thCls}>Precio</th>
                <th className={thCls}>Rendimiento</th>
                <th className={thCls}>Estado</th>
                <th className={thCls}></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filtered.map(p => (
                <tr key={p.id_paquete} className="hover:bg-accent transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-xs font-semibold text-foreground">{p.nombre_paquete}</p>
                    {p.descripcion && (
                      <p className="text-[11px] text-muted-foreground truncate max-w-[280px]">{p.descripcion}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {p.duracion_dias} día{p.duracion_dias === 1 ? "" : "s"}
                  </td>
                  <td className="px-4 py-3 text-xs font-medium text-foreground whitespace-nowrap">
                    ${p.precio_base?.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-xs whitespace-nowrap">
                    {(() => {
                      const r = rendimientoPorPaquete.get(p.id_paquete);
                      if (!r || r.activas === 0) {
                        return <span className="text-muted-foreground/60">Sin reservas</span>;
                      }
                      return (
                        <div>
                          <p className="font-medium text-foreground">{r.activas} reserva{r.activas === 1 ? "" : "s"}</p>
                          <p className="text-[11px] text-muted-foreground">${r.ingresos.toLocaleString()}</p>
                        </div>
                      );
                    })()}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={p.activo ? "activo" : "inactivo"} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      {!p.activo && (
                        <button
                          onClick={() => handleReactivar(p)}
                          className="px-2.5 py-1 text-[11px] font-medium text-primary border border-primary/30 rounded-lg hover:bg-primary/10 transition-all"
                        >
                          Reactivar
                        </button>
                      )}
                      <button
                        onClick={() => openEdit(p)}
                        className="p-1.5 text-primary/60 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      {p.activo && (
                        <button
                          onClick={() => onDelete(p.id_paquete)}
                          className="p-1.5 text-destructive/60 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all"
                          title="Desactivar paquete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          icon={Search}
          title="No se encontraron paquetes"
          description={paquetes.length === 0 ? "Crea el primer paquete para empezar." : "Prueba con otro término de búsqueda o filtro."}
        />
      )}

      <AdminModal
        open={modalOpen}
        onOpenChange={(o) => { if (!o) closeModal(); else setModalOpen(true); }}
        title={editingId ? "Editar paquete" : "Crear paquete"}
        maxWidth="sm:max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-3">
          {msg && (
            <div className="p-3 rounded-xl text-sm font-medium bg-destructive/10 text-destructive">
              {msg.text}
            </div>
          )}
          <div>
            <label className={labelCls}>Nombre del paquete</label>
            <input value={form.nombre_paquete} onChange={e => setForm({ ...form, nombre_paquete: e.target.value })}
              className={inputCls} required placeholder="Magia del Caribe" />
          </div>
          <div>
            <label className={labelCls}>Descripción</label>
            <textarea value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })}
              className={inputCls + " resize-none"} rows={3} placeholder="Descripción del paquete..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Duración (días)</label>
              <input type="number" min="1" value={form.duracion_dias}
                onChange={e => setForm({ ...form, duracion_dias: e.target.value })}
                className={inputCls} required />
            </div>
            <div>
              <label className={labelCls}>Precio base ($)</label>
              <input type="number" min="0" step="1000" value={form.precio_base}
                onChange={e => setForm({ ...form, precio_base: e.target.value })}
                className={inputCls} required placeholder="1200000" />
            </div>
          </div>

          {/* Hoteles vinculados (paquete_hotel) — antes esta tabla no tenía
              ningún punto de escritura en el admin: un paquete nuevo quedaba
              siempre sin hotel real asociado, lo que permitía armar
              combinaciones ilógicas en Crear Reserva (un paquete de Bogotá
              con un hotel de Barranquilla, sin ninguna relación real entre
              los dos). */}
          <div>
            <label className={labelCls}>
              Hoteles incluidos {cargandoHoteles && <span className="text-muted-foreground font-normal">(cargando...)</span>}
            </label>
            {hoteles.length === 0 ? (
              <p className="text-xs text-muted-foreground/70 mt-1">No hay hoteles registrados todavía.</p>
            ) : (
              <div className="mt-1.5 max-h-44 overflow-y-auto space-y-1.5 border border-border rounded-xl p-2.5">
                {hoteles.map((h) => {
                  const seleccionado = form.hoteles.find((fh) => fh.id_hotel === h.id_hotel);
                  return (
                    <div key={h.id_hotel} className="flex items-center gap-2.5">
                      <label className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!seleccionado}
                          onChange={() => toggleHotel(h.id_hotel)}
                          className="w-4 h-4 rounded text-primary focus:ring-primary border-border cursor-pointer flex-shrink-0"
                        />
                        <Hotel className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                        <span className="text-xs text-foreground truncate">
                          {h.nombre_hotel} <span className="text-muted-foreground">· {h.ciudad}</span>
                        </span>
                      </label>
                      {seleccionado && (
                        <input
                          type="number"
                          min="1"
                          placeholder="noches"
                          value={seleccionado.noches_incluidas}
                          onChange={(e) => setNochesHotel(h.id_hotel, e.target.value)}
                          className="w-20 px-2 py-1 text-xs border border-border rounded-lg bg-card text-foreground outline-none focus:ring-2 focus:ring-primary/30 flex-shrink-0"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Toggle de estado — antes el form lo guardaba en memoria
              (EMPTY_FORM.activo) pero nunca se mostraba ningún control para
              cambiarlo; un admin no podía desactivar/reactivar un paquete
              desde el formulario, solo con el botón de eliminar. */}
          <div className="flex items-center justify-between px-1 py-1">
            <div>
              <p className="text-sm font-medium text-foreground">Paquete activo</p>
              <p className="text-xs text-muted-foreground">Visible y reservable en el sitio público</p>
            </div>
            <Switch checked={form.activo} onCheckedChange={v => setForm({ ...form, activo: v })} />
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-2.5 bg-gradient-to-r from-primary to-[#A13B55] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-50 text-sm">
            {loading ? "Guardando..." : editingId ? "Guardar cambios" : "Crear paquete"}
          </button>
        </form>
      </AdminModal>
    </div>
  );
}
