import { useState } from "react";
import { Search, Trash2, ShieldCheck, ShieldOff } from "lucide-react";
import { Usuario, Rol, inputCls, labelCls } from "./types";

const EMPTY_FORM = {
  username: "", correo_electronico: "", password: "", roles: [] as string[],
};

interface Props {
  usuarios: Usuario[];
  roles: Rol[];
  onDelete: (id: number) => void;
  onSubmit: (data: any) => Promise<void>;
  onToggleActivo: (usuario: Usuario) => Promise<void>;
  loading: boolean;
}

export default function ModuleUsuarios({ usuarios, roles, onDelete, onSubmit, onToggleActivo, loading }: Props) {
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const filtered = usuarios.filter(u =>
    `${u.username} ${u.correo_electronico} ${u.nombre_completo ?? ""}`.toLowerCase().includes(search.toLowerCase())
  );

  const toggleRol = (nombre_rol: string) => {
    setForm(f => ({
      ...f,
      roles: f.roles.includes(nombre_rol) ? f.roles.filter(r => r !== nombre_rol) : [...f.roles, nombre_rol],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    try {
      await onSubmit(form);
      setMsg({ type: "ok", text: "Usuario creado exitosamente" });
      setForm(EMPTY_FORM);
    } catch (err: any) {
      setMsg({ type: "err", text: err.message || "Error al crear usuario" });
    }
  };

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-bold text-foreground">Usuarios y roles</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
          <h3 className="font-semibold text-foreground mb-4">Crear usuario</h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            {msg && (
              <div className={`p-3 rounded-xl text-sm font-medium ${msg.type === "ok" ? "bg-accent text-primary" : "bg-destructive/10 text-destructive"}`}>
                {msg.text}
              </div>
            )}
            <div>
              <label className={labelCls}>Usuario</label>
              <input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })}
                className={inputCls} required placeholder="nuevo.usuario" minLength={3} />
            </div>
            <div>
              <label className={labelCls}>Correo</label>
              <input type="email" value={form.correo_electronico}
                onChange={e => setForm({ ...form, correo_electronico: e.target.value })}
                className={inputCls} required placeholder="usuario@alektours.com" />
            </div>
            <div>
              <label className={labelCls}>Contraseña</label>
              <input type="password" value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                className={inputCls} required minLength={8} placeholder="Mínimo 8 caracteres" />
            </div>
            <div>
              <label className={labelCls}>Roles</label>
              <div className="flex flex-wrap gap-2">
                {roles.map(r => (
                  <button
                    key={r.id_rol}
                    type="button"
                    onClick={() => toggleRol(r.nombre_rol)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${form.roles.includes(r.nombre_rol)
                      ? "bg-primary border-primary text-primary-foreground"
                      : "bg-card border-border text-muted-foreground hover:border-primary/40"
                      }`}
                  >
                    {r.nombre_rol}
                  </button>
                ))}
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-primary to-[#A13B55] text-primary-foreground font-semibold rounded-xl hover:shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-50 text-sm">
              {loading ? "Guardando..." : "Crear Usuario"}
            </button>
          </form>
        </div>

        <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Usuarios registrados</h3>
            <span className="text-xs text-muted-foreground">{usuarios.length} total</span>
          </div>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Usuario, correo, nombre..."
              className="w-full pl-9 pr-4 py-2 border border-border bg-input-background text-foreground placeholder:text-muted-foreground/60 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all" />
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filtered.map(u => (
              <div key={u.id_usuario} className="flex items-center justify-between p-3 hover:bg-muted rounded-xl transition-colors">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {u.nombre_completo || u.username}
                    {!u.activo && <span className="ml-2 text-[10px] font-bold text-destructive uppercase">Inactivo</span>}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{u.correo_electronico}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {u.roles.map(r => (
                      <span key={r} className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-accent text-primary">{r}</span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => onToggleActivo(u)}
                    title={u.activo ? "Desactivar" : "Activar"}
                    className={`p-1.5 rounded-lg transition-all ${u.activo ? "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30" : "text-muted-foreground hover:bg-muted"}`}>
                    {u.activo ? <ShieldCheck className="w-4 h-4" /> : <ShieldOff className="w-4 h-4" />}
                  </button>
                  <button onClick={() => onDelete(u.id_usuario)}
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
