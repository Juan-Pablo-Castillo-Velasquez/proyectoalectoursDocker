import { useEffect, useState } from "react";
import {
  Search, Trash2, Pencil, PlusCircle, Star, MapPin, Bed, Hotel, AlertTriangle,
  Eye, Plus, X, Clock, Loader2, DoorOpen,
} from "lucide-react";
import { HotelData, inputCls, labelCls } from "./types";
import { hotelService, TipoHabitacionResponse, HabitacionResponse } from "../../services/hotel.service";
import AdminModal from "./ui/AdminModal";
import StatCard from "./ui/StatCard";
import SectionHeader from "./ui/SectionHeader";
import EmptyState from "./ui/EmptyState";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../ui/select";
import Pagination from "../ui/pagination";
import { usePagination } from "../../hooks/usePagination";

const EMPTY_FORM = {
  nombre_hotel: "", calificacion: "3", ciudad: "",
  pais: "", correo_electronico: "", telefono: ""
};

const EMPTY_HAB_FORM = { id_tipo_habitacion: "", numero_habitacion: "", precio_noche: "", estado: "disponible" };

interface Props {
  hoteles: HotelData[];
  onDelete: (id: number) => void;
  onSubmit: (data: any, id?: number) => Promise<void>;
  loading: boolean;
  // Refresca la lista completa de hoteles (con sus habitaciones anidadas)
  // después de crear/editar/eliminar una habitación desde el pop-up de
  // detalle — mismo fetchHoteles que ya usa Admindashboard.tsx al montar,
  // para que la columna "Habitaciones" de la tabla no quede desactualizada.
  onHabitacionesChanged?: () => void;
}

export default function ModuleHoteles({ hoteles, onDelete, onSubmit, loading, onHabitacionesChanged }: Props) {
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // KPIs reales: ciudades/países cubiertos y calificación promedio real de
  // reseñas (calificacion_promedio) con respaldo en la calificación fija
  // del hotel cuando todavía no tiene ninguna reseña. Se reutilizan también
  // como opciones de los filtros de abajo.
  const ciudades = Array.from(new Set(hoteles.map(h => h.ciudad).filter(Boolean))).sort();
  const paises = Array.from(new Set(hoteles.map(h => h.pais).filter(Boolean))).sort();

  const [ciudadFilter, setCiudadFilter] = useState("todos");
  const [paisFilter, setPaisFilter] = useState("todos");
  // Antes no había forma de aislar, en una lista larga, los hoteles que
  // hoy no pueden recibir NINGUNA reserva de hotel (sin habitaciones
  // registradas o todas ocupadas/en mantenimiento) sin abrir cada uno.
  const [disponibilidadFilter, setDisponibilidadFilter] = useState<"todos" | "con_disponible" | "sin_disponible">("todos");

  const filtered = hoteles.filter(h => {
    const q = search.toLowerCase();
    const matchSearch = !q || h.nombre_hotel.toLowerCase().includes(q) || h.ciudad?.toLowerCase().includes(q);
    const matchCiudad = ciudadFilter === "todos" || h.ciudad === ciudadFilter;
    const matchPais = paisFilter === "todos" || h.pais === paisFilter;
    const tieneDisponible = (h.habitaciones ?? []).some(hab => hab.estado === "disponible");
    const matchDisponibilidad = disponibilidadFilter === "todos"
      || (disponibilidadFilter === "con_disponible" ? tieneDisponible : !tieneDisponible);
    return matchSearch && matchCiudad && matchPais && matchDisponibilidad;
  });

  const { page, pageCount, slice, setPage } = usePagination(filtered, 8);

  const hasActiveFilters = search.trim() !== "" || ciudadFilter !== "todos" || paisFilter !== "todos" || disponibilidadFilter !== "todos";
  function clearFilters() { setSearch(""); setCiudadFilter("todos"); setPaisFilter("todos"); setDisponibilidadFilter("todos"); }
  const calificaciones = hoteles.map(h => h.calificacion_promedio ?? h.calificacion).filter((n): n is number => n != null);
  const promedioGeneral = calificaciones.length
    ? (calificaciones.reduce((a, b) => a + b, 0) / calificaciones.length).toFixed(1)
    : "—";

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setMsg(null);
    setModalOpen(true);
  }

  function openEdit(h: HotelData) {
    setEditingId(h.id_hotel);
    setForm({
      nombre_hotel: h.nombre_hotel, calificacion: String(h.calificacion), ciudad: h.ciudad,
      pais: h.pais, correo_electronico: h.correo_electronico ?? "", telefono: h.telefono ?? ""
    });
    setMsg(null);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setMsg(null);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    try {
      await onSubmit({ ...form, calificacion: parseInt(form.calificacion) }, editingId ?? undefined);
      closeModal();
    } catch (err: any) {
      setMsg({ type: "err", text: err.message || "Error al guardar hotel" });
    }
  };

  // Catálogo de tipos de habitación (Individual, Doble, Suite...) — se
  // carga una sola vez, el backend ya tenía el modelo pero ningún endpoint
  // para leerlo hasta ahora (ver GET /hoteles/tipos-habitacion/).
  const [tiposHabitacion, setTiposHabitacion] = useState<TipoHabitacionResponse[]>([]);
  useEffect(() => {
    hotelService.getTiposHabitacion().then(setTiposHabitacion).catch(() => {});
  }, []);

  // Pop-up de detalle por hotel: gestión real de habitaciones (el backend
  // ya soportaba crear/editar/eliminar, solo faltaba la pantalla) y cuánto
  // tiempo va a estar ocupada cada una (GET /hoteles/{id}/fechas-ocupadas,
  // ya existía y ya lo usa el buscador público — acá nadie lo consumía).
  const [detailHotel, setDetailHotel] = useState<HotelData | null>(null);
  const [fechasOcupadas, setFechasOcupadas] = useState<Record<number, { fecha_checkin: string; fecha_checkout: string }[]>>({});
  const [cargandoFechas, setCargandoFechas] = useState(false);
  const [habForm, setHabForm] = useState(EMPTY_HAB_FORM);
  const [editingHabId, setEditingHabId] = useState<number | null>(null);
  const [habMsg, setHabMsg] = useState("");
  const [savingHab, setSavingHab] = useState(false);

  function abrirDetalle(h: HotelData) {
    setDetailHotel(h);
    setHabForm(EMPTY_HAB_FORM);
    setEditingHabId(null);
    setHabMsg("");
    setCargandoFechas(true);
    hotelService.getFechasOcupadas(h.id_hotel)
      .then((lista) => {
        const mapa: Record<number, { fecha_checkin: string; fecha_checkout: string }[]> = {};
        for (const item of lista) mapa[item.id_habitacion] = item.rangos;
        setFechasOcupadas(mapa);
      })
      .catch(() => setFechasOcupadas({}))
      .finally(() => setCargandoFechas(false));
  }

  function cerrarDetalle() {
    setDetailHotel(null);
    setFechasOcupadas({});
    setHabForm(EMPTY_HAB_FORM);
    setEditingHabId(null);
    setHabMsg("");
  }

  function proximaOcupacion(id_habitacion: number): string | null {
    const hoy = new Date().toISOString().slice(0, 10);
    const rangos = (fechasOcupadas[id_habitacion] ?? []).filter((r) => r.fecha_checkout >= hoy);
    if (rangos.length === 0) return null;
    const ordenados = [...rangos].sort((a, b) => a.fecha_checkin.localeCompare(b.fecha_checkin));
    const total = ordenados.length;
    const primero = ordenados[0];
    return `${primero.fecha_checkin} → ${primero.fecha_checkout}${total > 1 ? ` (+${total - 1} más)` : ""}`;
  }

  function openHabEdit(hab: HabitacionResponse) {
    setEditingHabId(hab.id_habitacion);
    setHabForm({
      id_tipo_habitacion: String(hab.id_tipo_habitacion),
      numero_habitacion: hab.numero_habitacion,
      precio_noche: String(hab.precio_noche),
      estado: hab.estado,
    });
    setHabMsg("");
  }

  function openHabCreate() {
    setEditingHabId(null);
    setHabForm(EMPTY_HAB_FORM);
    setHabMsg("");
  }

  async function handleHabSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!detailHotel) return;
    setHabMsg("");
    setSavingHab(true);
    try {
      const payload = {
        id_tipo_habitacion: parseInt(habForm.id_tipo_habitacion, 10),
        numero_habitacion: habForm.numero_habitacion.trim(),
        precio_noche: parseFloat(habForm.precio_noche),
        estado: habForm.estado,
      };
      if (editingHabId) {
        await hotelService.updateHabitacion(editingHabId, payload);
      } else {
        await hotelService.createHabitacion(detailHotel.id_hotel, payload);
      }
      onHabitacionesChanged?.();
      // Refresca el hotel abierto en el pop-up con los datos ya guardados
      // en la BD, en vez de tratar de reconstruirlo a mano en el cliente.
      const actualizado = await hotelService.getById(detailHotel.id_hotel);
      setDetailHotel(actualizado);
      setHabForm(EMPTY_HAB_FORM);
      setEditingHabId(null);
    } catch (err: any) {
      setHabMsg(err?.message || "No se pudo guardar la habitación");
    } finally {
      setSavingHab(false);
    }
  }

  async function handleHabDelete(id_habitacion: number) {
    if (!detailHotel) return;
    try {
      await hotelService.deleteHabitacion(id_habitacion);
      onHabitacionesChanged?.();
      const actualizado = await hotelService.getById(detailHotel.id_hotel);
      setDetailHotel(actualizado);
    } catch (err: any) {
      setHabMsg(err?.message || "No se pudo eliminar la habitación");
    }
  }

  const thCls = "px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap";

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Hoteles"
        subtitle={`${hoteles.length} hotel${hoteles.length === 1 ? "" : "es"} registrado${hoteles.length === 1 ? "" : "s"}`}
        action={
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-[#A13B55] text-white rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-primary/20 transition-all"
          >
            <PlusCircle className="w-4 h-4" /> Nuevo hotel
          </button>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total"                  value={hoteles.length}   icon={Hotel} />
        <StatCard label="Calificación promedio"   value={promedioGeneral} icon={Star} gradient="from-[#C9A227] to-[#C9A227]" />
        <StatCard label="Ciudades"                value={ciudades.length} icon={MapPin} />
        <StatCard label="Países"                  value={paises.length}   icon={MapPin} gradient="from-[#A13B55] to-[#A13B55]" />
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre o ciudad..."
            className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl text-sm outline-none
              bg-card text-foreground placeholder:text-muted-foreground/60
              focus:ring-2 focus:ring-primary/40 focus:border-transparent"
          />
        </div>
        <Select value={ciudadFilter} onValueChange={setCiudadFilter}>
          <SelectTrigger className="w-auto min-w-[140px] h-auto py-2 bg-card border-border text-xs">
            <SelectValue placeholder="Ciudad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas las ciudades</SelectItem>
            {ciudades.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={paisFilter} onValueChange={setPaisFilter}>
          <SelectTrigger className="w-auto min-w-[130px] h-auto py-2 bg-card border-border text-xs">
            <SelectValue placeholder="País" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los países</SelectItem>
            {paises.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={disponibilidadFilter} onValueChange={(v) => setDisponibilidadFilter(v as "todos" | "con_disponible" | "sin_disponible")}>
          <SelectTrigger className="w-auto min-w-[170px] h-auto py-2 bg-card border-border text-xs">
            <SelectValue placeholder="Disponibilidad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Cualquier disponibilidad</SelectItem>
            <SelectItem value="con_disponible">Con habitación disponible</SelectItem>
            <SelectItem value="sin_disponible">Sin habitación disponible</SelectItem>
          </SelectContent>
        </Select>
        {hasActiveFilters && (
          <button onClick={clearFilters} className="text-xs font-medium text-muted-foreground hover:text-foreground underline underline-offset-2">
            Limpiar filtros
          </button>
        )}
      </div>

      {filtered.length > 0 ? (
        <>
        <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b border-border">
              <tr>
                <th className={thCls}>Hotel</th>
                <th className={thCls}>Calificación</th>
                <th className={thCls}>Habitaciones</th>
                <th className={thCls}>Contacto</th>
                <th className={thCls}></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {slice.map(h => (
                <tr key={h.id_hotel} className="hover:bg-accent transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-xs font-semibold text-foreground">{h.nombre_hotel}</p>
                    <p className="text-[11px] text-muted-foreground">{h.ciudad}, {h.pais}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-xs text-foreground">
                      <Star className="w-3.5 h-3.5 text-[#C9A227] fill-[#C9A227]" />
                      <span className="font-medium">{h.calificacion_promedio ?? h.calificacion}</span>
                      {!!h.total_resenas && (
                        <span className="text-[11px] text-muted-foreground">({h.total_resenas} reseña{h.total_resenas === 1 ? "" : "s"})</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {(() => {
                      // Antes solo mostraba el total de habitaciones. El backend
                      // (HotelDetailResponse) ya manda el estado real de cada
                      // habitación (Habitacion.estado), así que ahora se muestra
                      // el desglose real disponible/ocupada/mantenimiento en vez
                      // de un número plano, y se marca cuando un hotel no tiene
                      // ninguna habitación registrada (no puede recibir reservas
                      // de hotel aunque aparezca "activo" en el listado público).
                      const habs = h.habitaciones ?? [];
                      if (habs.length === 0) {
                        return (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 bg-amber-500/10 px-2 py-1 rounded-full whitespace-nowrap">
                            <AlertTriangle className="w-3 h-3" /> Sin habitaciones
                          </span>
                        );
                      }
                      const disponibles = habs.filter(hb => hb.estado === "disponible").length;
                      const ocupadas = habs.filter(hb => hb.estado === "ocupada").length;
                      const mantenimiento = habs.filter(hb => hb.estado === "mantenimiento").length;
                      return (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 text-emerald-600">
                            <Bed className="w-3.5 h-3.5" /> {disponibles}
                          </span>
                          <span className="text-border">/</span>
                          <span>{ocupadas} ocup.</span>
                          {mantenimiento > 0 && (
                            <span className="text-amber-600">· {mantenimiento} mant.</span>
                          )}
                        </div>
                      );
                    })()}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {h.correo_electronico && <p className="truncate max-w-[180px]">{h.correo_electronico}</p>}
                    {h.telefono && <p>{h.telefono}</p>}
                    {!h.correo_electronico && !h.telefono && "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={() => abrirDetalle(h)}
                        className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all"
                        title="Ver habitaciones y ocupación"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openEdit(h)}
                        className="p-1.5 text-primary/60 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(h.id_hotel)}
                        className="p-1.5 text-destructive/60 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={page} pageCount={pageCount} onPageChange={setPage} className="mt-4" />
        </>
      ) : (
        <EmptyState
          icon={Search}
          title="No se encontraron hoteles"
          description={hoteles.length === 0 ? "Registra el primer hotel para empezar." : "Prueba con otro término de búsqueda."}
        />
      )}

      <AdminModal
        open={modalOpen}
        onOpenChange={(o) => { if (!o) closeModal(); else setModalOpen(true); }}
        title={editingId ? "Editar hotel" : "Registrar hotel"}
        maxWidth="sm:max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-3">
          {msg && (
            <div className="p-3 rounded-xl text-sm font-medium bg-destructive/10 text-destructive">
              {msg.text}
            </div>
          )}
          <div>
            <label className={labelCls}>Nombre</label>
            <input value={form.nombre_hotel} onChange={e => setForm({ ...form, nombre_hotel: e.target.value })}
              className={inputCls} required placeholder="Hotel Paraíso" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Ciudad</label>
              <input value={form.ciudad} onChange={e => setForm({ ...form, ciudad: e.target.value })}
                className={inputCls} required placeholder="Bogotá" />
            </div>
            <div>
              <label className={labelCls}>País</label>
              <input value={form.pais} onChange={e => setForm({ ...form, pais: e.target.value })}
                className={inputCls} required placeholder="Colombia" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Calificación</label>
              <select value={form.calificacion} onChange={e => setForm({ ...form, calificacion: e.target.value })} className={inputCls}>
                {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{"★".repeat(n)} ({n})</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Teléfono</label>
              <input value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })}
                className={inputCls} placeholder="+57..." />
            </div>
          </div>
          <div>
            <label className={labelCls}>Correo</label>
            <input type="email" value={form.correo_electronico}
              onChange={e => setForm({ ...form, correo_electronico: e.target.value })}
              className={inputCls} placeholder="info@hotel.com" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-2.5 bg-gradient-to-r from-primary to-[#A13B55] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-50 text-sm">
            {loading ? "Guardando..." : editingId ? "Guardar cambios" : "Registrar hotel"}
          </button>
        </form>
      </AdminModal>

      {/* Pop-up de detalle: gestión real de habitaciones (crear/editar/
          eliminar, el backend ya lo soportaba) y cuánto tiempo va a estar
          ocupada cada una — lo que pedía el usuario en vez de solo un
          conteo plano en la tabla. */}
      <AdminModal
        open={!!detailHotel}
        onOpenChange={(o) => { if (!o) cerrarDetalle(); }}
        title={detailHotel?.nombre_hotel ?? "Habitaciones"}
        description={detailHotel ? `${detailHotel.ciudad}, ${detailHotel.pais}` : undefined}
        maxWidth="sm:max-w-xl"
      >
        {detailHotel && (
          <div className="space-y-4">
            <div className="max-h-72 overflow-y-auto space-y-1.5">
              {(detailHotel.habitaciones ?? []).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">Este hotel todavía no tiene ninguna habitación registrada.</p>
              )}
              {(detailHotel.habitaciones ?? []).map((hab: any) => {
                const ocupacion = proximaOcupacion(hab.id_habitacion);
                return (
                  <div key={hab.id_habitacion} className="flex items-center gap-3 p-2.5 border border-border rounded-xl bg-card">
                    <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                      <DoorOpen className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground truncate">
                        Hab. {hab.numero_habitacion} — {hab.tipo_habitacion?.nombre_tipo ?? "—"}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        ${Number(hab.precio_noche).toLocaleString()}/noche
                        {hab.tipo_habitacion?.capacidad_personas ? ` · hasta ${hab.tipo_habitacion.capacidad_personas} personas` : ""}
                      </p>
                      {cargandoFechas ? (
                        <p className="text-[11px] text-muted-foreground/70 flex items-center gap-1 mt-0.5"><Loader2 className="w-3 h-3 animate-spin" /> Consultando ocupación...</p>
                      ) : ocupacion ? (
                        <p className="text-[11px] text-[#C9A227] flex items-center gap-1 mt-0.5"><Clock className="w-3 h-3" /> Ocupada {ocupacion}</p>
                      ) : (
                        <p className="text-[11px] text-emerald-600 mt-0.5">Sin reservas futuras</p>
                      )}
                    </div>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 capitalize ${
                      hab.estado === "disponible" ? "bg-emerald-500/10 text-emerald-600"
                      : hab.estado === "mantenimiento" ? "bg-amber-500/10 text-amber-600"
                      : "bg-muted text-muted-foreground"
                    }`}>
                      {hab.estado}
                    </span>
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      <button type="button" onClick={() => openHabEdit(hab)} className="p-1.5 text-primary/60 hover:text-primary hover:bg-primary/10 rounded-lg transition-all">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" onClick={() => handleHabDelete(hab.id_habitacion)} className="p-1.5 text-destructive/60 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <form onSubmit={handleHabSubmit} className="space-y-2.5 border-t border-border pt-4">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                  {editingHabId ? "Editar habitación" : "Agregar habitación"}
                </p>
                {editingHabId && (
                  <button type="button" onClick={openHabCreate} className="text-[11px] font-medium text-muted-foreground hover:text-foreground flex items-center gap-1">
                    <X className="w-3 h-3" /> Cancelar edición
                  </button>
                )}
              </div>
              {habMsg && <p className="text-xs text-destructive">{habMsg}</p>}
              <div className="grid grid-cols-2 gap-2.5">
                <select value={habForm.id_tipo_habitacion}
                  onChange={(e) => setHabForm({ ...habForm, id_tipo_habitacion: e.target.value })}
                  className={inputCls} required>
                  <option value="">Tipo de habitación...</option>
                  {tiposHabitacion.map((t) => (
                    <option key={t.id_tipo_habitacion} value={t.id_tipo_habitacion}>
                      {t.nombre_tipo} (hasta {t.capacidad_personas})
                    </option>
                  ))}
                </select>
                <input value={habForm.numero_habitacion}
                  onChange={(e) => setHabForm({ ...habForm, numero_habitacion: e.target.value })}
                  className={inputCls} required placeholder="Número (ej: 204)" />
                <input type="number" min="0" step="1000" value={habForm.precio_noche}
                  onChange={(e) => setHabForm({ ...habForm, precio_noche: e.target.value })}
                  className={inputCls} required placeholder="Precio/noche" />
                <select value={habForm.estado}
                  onChange={(e) => setHabForm({ ...habForm, estado: e.target.value })}
                  className={inputCls}>
                  <option value="disponible">Disponible</option>
                  <option value="ocupada">Ocupada</option>
                  <option value="mantenimiento">Mantenimiento</option>
                </select>
              </div>
              <button type="submit" disabled={savingHab}
                className="w-full py-2 bg-gradient-to-r from-primary to-[#A13B55] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-50 text-sm flex items-center justify-center gap-1.5">
                <Plus className="w-4 h-4" /> {savingHab ? "Guardando..." : editingHabId ? "Guardar cambios" : "Agregar habitación"}
              </button>
              {tiposHabitacion.length === 0 && (
                <p className="text-[11px] text-muted-foreground/70">Todavía no hay ningún tipo de habitación registrado en el sistema.</p>
              )}
            </form>
          </div>
        )}
      </AdminModal>
    </div>
  );
}
