import { useState } from "react";
import { Search, Trash2, Pencil, X } from "lucide-react";
import { Paquete, inputCls, labelCls } from "./types";

const EMPTY_FORM = {
  nombre_paquete: "", descripcion: "", duracion_dias: "1", precio_base: "", activo: true
};

interface Props {
  paquetes: Paquete[];
  onDelete: (id: number) => void;
  onSubmit: (data: any, id?: number) => Promise<void>;
  loading: boolean;
}

export default function ModulePaquetes({ paquetes, onDelete, onSubmit, loading }: Props) {
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const filtered = paquetes.filter(p =>
    p.nombre_paquete.toLowerCase().includes(search.toLowerCase())
  );

  const startEdit = (p: Paquete) => {
    setEditingId(p.id_paquete);
    setForm({
      nombre_paquete: p.nombre_paquete, descripcion: p.descripcion ?? "",
      duracion_dias: String(p.duracion_dias ?? 1), precio_base: String(p.precio_base ?? ""),
      activo: p.activo
    });
    setMsg(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    try {
      await onSubmit({ ...form, duracion_dias: parseInt(form.duracion_dias), precio_base: parseFloat(form.precio_base) }, editingId ?? undefined);
      setMsg({ type: "ok", text: editingId ? "Paquete actualizado exitosamente" : "Paquete creado exitosamente" });
      setEditingId(null);
      setForm(EMPTY_FORM);
    } catch (err: any) {
      setMsg({ type: "err", text: err.message || "Error al guardar paquete" });
    }
  };

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-bold text-foreground">Paquetes</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">{editingId ? "Editar paquete" : "Crear paquete"}</h3>
            {editingId && (
              <button type="button" onClick={cancelEdit} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                <X className="w-3.5 h-3.5" /> Cancelar
              </button>
            )}
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            {msg && (
              <div className={`p-3 rounded-xl text-sm font-medium ${msg.type === "ok" ? "bg-accent text-primary" : "bg-destructive/10 text-destructive"}`}>
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
            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-primary to-[#A13B55] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-50 text-sm">
              {loading ? "Guardando..." : editingId ? "Guardar cambios" : "Crear Paquete"}
            </button>
          </form>
        </div>

        <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Paquetes activos</h3>
            <span className="text-xs text-muted-foreground">{paquetes.length} total</span>
          </div>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..."
              className="w-full pl-9 pr-4 py-2 border border-border bg-input-background text-foreground placeholder:text-muted-foreground/60 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all" />
          </div>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {filtered.map(p => (
              <div key={p.id_paquete} className={`flex items-center justify-between p-3 hover:bg-muted rounded-xl transition-colors ${editingId === p.id_paquete ? "bg-accent" : ""}`}>
                <div>
                  <p className="text-sm font-medium text-foreground">{p.nombre_paquete}</p>
                  <p className="text-xs text-muted-foreground">{p.duracion_dias} días · ${p.precio_base?.toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => startEdit(p)}
                    className="p-1.5 text-primary/60 hover:text-primary hover:bg-primary/10 rounded-lg transition-all">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => onDelete(p.id_paquete)}
                    className="p-1.5 text-destructive/60 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}