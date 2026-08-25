import { useState } from "react";
import { Search, Trash2, Pencil, X } from "lucide-react";
import { Cliente, inputCls, labelCls } from "./types";

const EMPTY_FORM = {
  nombre: "", apellido: "", cedula: "", correo: "",
  celular: "", direccion: "", ciudad: "", pais: "", fecha_nacimiento: ""
};

interface Props {
  clientes: Cliente[];
  onDelete: (id: number) => void;
  onSubmit: (data: any, id?: number) => Promise<void>;
  loading: boolean;
}

export default function ModuleClientes({ clientes, onDelete, onSubmit, loading }: Props) {
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const filtered = clientes.filter(c =>
    `${c.nombre} ${c.apellido} ${c.cedula} ${c.correo}`.toLowerCase().includes(search.toLowerCase())
  );

  const startEdit = (c: Cliente) => {
    setEditingId(c.id_cliente);
    setForm({
      nombre: c.nombre, apellido: c.apellido, cedula: c.cedula, correo: c.correo ?? "",
      celular: c.celular ?? "", direccion: c.direccion ?? "", ciudad: c.ciudad ?? "",
      pais: c.pais ?? "", fecha_nacimiento: c.fecha_nacimiento ?? ""
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
      await onSubmit(form, editingId ?? undefined);
      setMsg({ type: "ok", text: editingId ? "Cliente actualizado exitosamente" : "Cliente registrado exitosamente" });
      setEditingId(null);
      setForm(EMPTY_FORM);
    } catch (err: any) {
      setMsg({ type: "err", text: err.message || "Error al guardar cliente" });
    }
  };

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-bold text-foreground">Clientes</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">{editingId ? "Editar cliente" : "Registrar cliente"}</h3>
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Nombre</label>
                <input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })}
                  className={inputCls} required placeholder="Juan" />
              </div>
              <div>
                <label className={labelCls}>Apellido</label>
                <input value={form.apellido} onChange={e => setForm({ ...form, apellido: e.target.value })}
                  className={inputCls} required placeholder="Pérez" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Cédula</label>
                <input value={form.cedula} onChange={e => setForm({ ...form, cedula: e.target.value })}
                  className={inputCls} required placeholder="1000111222" />
              </div>
              <div>
                <label className={labelCls}>Celular</label>
                <input value={form.celular} onChange={e => setForm({ ...form, celular: e.target.value })}
                  className={inputCls} placeholder="+57..." />
              </div>
            </div>
            <div>
              <label className={labelCls}>Correo</label>
              <input type="email" value={form.correo} onChange={e => setForm({ ...form, correo: e.target.value })}
                className={inputCls} placeholder="juan@email.com" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Ciudad</label>
                <input value={form.ciudad} onChange={e => setForm({ ...form, ciudad: e.target.value })}
                  className={inputCls} placeholder="Bogotá" />
              </div>
              <div>
                <label className={labelCls}>País</label>
                <input value={form.pais} onChange={e => setForm({ ...form, pais: e.target.value })}
                  className={inputCls} placeholder="Colombia" />
              </div>
            </div>
            <div>
              <label className={labelCls}>Fecha de nacimiento</label>
              <input type="date" value={form.fecha_nacimiento}
                onChange={e => setForm({ ...form, fecha_nacimiento: e.target.value })}
                className={inputCls} />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-primary to-[#A13B55] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-50 text-sm">
              {loading ? "Guardando..." : editingId ? "Guardar cambios" : "Registrar Cliente"}
            </button>
          </form>
        </div>

        <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Clientes registrados</h3>
            <span className="text-xs text-muted-foreground">{clientes.length} total</span>
          </div>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Nombre, cédula, correo..."
              className="w-full pl-9 pr-4 py-2 border border-border rounded-lg text-sm outline-none" />
          </div>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {filtered.map(c => (
              <div key={c.id_cliente} className={`flex items-center justify-between p-3 hover:bg-muted rounded-xl transition-colors ${editingId === c.id_cliente ? "bg-accent" : ""}`}>
                <div>
                  <p className="text-sm font-medium text-foreground">{c.nombre} {c.apellido}</p>
                  <p className="text-xs text-muted-foreground">{c.cedula} · {c.ciudad}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => startEdit(c)}
                    className="p-1.5 text-primary/60 hover:text-primary hover:bg-primary/10 rounded-lg transition-all">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => onDelete(c.id_cliente)}
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