import { useState } from "react";
import { Search, Trash2, Pencil, PlusCircle, Star, MapPin, Bed, Hotel, AlertTriangle } from "lucide-react";
import { HotelData, inputCls, labelCls } from "./types";
import AdminModal from "./ui/AdminModal";
import StatCard from "./ui/StatCard";
import SectionHeader from "./ui/SectionHeader";
import EmptyState from "./ui/EmptyState";

const EMPTY_FORM = {
  nombre_hotel: "", calificacion: "3", ciudad: "",
  pais: "", correo_electronico: "", telefono: ""
};

interface Props {
  hoteles: HotelData[];
  onDelete: (id: number) => void;
  onSubmit: (data: any, id?: number) => Promise<void>;
  loading: boolean;
}

export default function ModuleHoteles({ hoteles, onDelete, onSubmit, loading }: Props) {
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const filtered = hoteles.filter(h =>
    h.nombre_hotel.toLowerCase().includes(search.toLowerCase()) ||
    h.ciudad?.toLowerCase().includes(search.toLowerCase())
  );

  // KPIs reales: ciudades/países cubiertos y calificación promedio real de
  // reseñas (calificacion_promedio) con respaldo en la calificación fija
  // del hotel cuando todavía no tiene ninguna reseña.
  const ciudades = new Set(hoteles.map(h => h.ciudad).filter(Boolean));
  const paises = new Set(hoteles.map(h => h.pais).filter(Boolean));
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
        <StatCard label="Ciudades"                value={ciudades.size}   icon={MapPin} />
        <StatCard label="Países"                  value={paises.size}     icon={MapPin} gradient="from-[#A13B55] to-[#A13B55]" />
      </div>

      <div className="relative">
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

      {filtered.length > 0 ? (
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
              {filtered.map(h => (
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
    </div>
  );
}
