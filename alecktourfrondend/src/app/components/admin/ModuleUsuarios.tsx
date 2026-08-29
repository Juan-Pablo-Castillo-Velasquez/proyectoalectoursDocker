import { useState } from "react";
import { Search, Trash2, PlusCircle, ShieldCheck, ShieldOff, Users, UserCheck, Mail } from "lucide-react";
import { Usuario, Rol, inputCls, labelCls, resolveFotoUrl } from "./types";
import AdminModal from "./ui/AdminModal";
import StatCard from "./ui/StatCard";
import SectionHeader from "./ui/SectionHeader";
import StatusBadge from "./ui/StatusBadge";
import EmptyState from "./ui/EmptyState";
import Avatar from "./ui/Avatar";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../ui/select";

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
  const [modalOpen, setModalOpen] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // KPIs reales — activos/verificados calculados sobre el arreglo `usuarios`
  // que ya llega del backend, nada inventado.
  const activos = usuarios.filter(u => u.activo);
  const verificados = usuarios.filter(u => u.verificado);

  const [rolFilter, setRolFilter] = useState("todos");
  const [estadoFilter, setEstadoFilter] = useState<"todos" | "activos" | "inactivos">("todos");
  const [verificadoFilter, setVerificadoFilter] = useState<"todos" | "verificados" | "no_verificados">("todos");

  const filtered = usuarios.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !q || `${u.username} ${u.correo_electronico} ${u.nombre_completo ?? ""}`.toLowerCase().includes(q);
    const matchRol = rolFilter === "todos" || u.roles.includes(rolFilter);
    const matchEstado = estadoFilter === "todos" || (estadoFilter === "activos" ? u.activo : !u.activo);
    const matchVerificado = verificadoFilter === "todos" || (verificadoFilter === "verificados" ? u.verificado : !u.verificado);
    return matchSearch && matchRol && matchEstado && matchVerificado;
  });

  const hasActiveFilters = search.trim() !== "" || rolFilter !== "todos" || estadoFilter !== "todos" || verificadoFilter !== "todos";
  function clearFilters() { setSearch(""); setRolFilter("todos"); setEstadoFilter("todos"); setVerificadoFilter("todos"); }

  const toggleRol = (nombre_rol: string) => {
    setForm(f => ({
      ...f,
      roles: f.roles.includes(nombre_rol) ? f.roles.filter(r => r !== nombre_rol) : [...f.roles, nombre_rol],
    }));
  };

  function openCreate() { setForm(EMPTY_FORM); setMsg(null); setModalOpen(true); }
  function closeModal() { setModalOpen(false); setForm(EMPTY_FORM); setMsg(null); }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    try {
      await onSubmit(form);
      closeModal();
    } catch (err: any) {
      setMsg({ type: "err", text: err.message || "Error al crear usuario" });
    }
  };

  const thCls = "px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap";

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Usuarios y roles"
        subtitle={`${usuarios.length} usuario${usuarios.length === 1 ? "" : "s"} registrado${usuarios.length === 1 ? "" : "s"}`}
        action={
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-[#A13B55] text-white rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-primary/20 transition-all"
          >
            <PlusCircle className="w-4 h-4" /> Nuevo usuario
          </button>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCard label="Total"       value={usuarios.length}   icon={Users} />
        <StatCard label="Activos"     value={activos.length}    icon={ShieldCheck} gradient="from-emerald-500 to-emerald-600" />
        <StatCard label="Verificados" value={verificados.length} icon={UserCheck}  gradient="from-[#C9A227] to-[#C9A227]" />
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por usuario, correo o nombre..."
            className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl text-sm outline-none
              bg-card text-foreground placeholder:text-muted-foreground/60
              focus:ring-2 focus:ring-primary/40 focus:border-transparent"
          />
        </div>
        <Select value={rolFilter} onValueChange={setRolFilter}>
          <SelectTrigger className="w-auto min-w-[130px] h-auto py-2 bg-card border-border text-xs">
            <SelectValue placeholder="Rol" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los roles</SelectItem>
            {roles.map(r => <SelectItem key={r.id_rol} value={r.nombre_rol}>{r.nombre_rol}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={estadoFilter} onValueChange={(v) => setEstadoFilter(v as "todos" | "activos" | "inactivos")}>
          <SelectTrigger className="w-auto min-w-[120px] h-auto py-2 bg-card border-border text-xs">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Activos e inactivos</SelectItem>
            <SelectItem value="activos">Activos</SelectItem>
            <SelectItem value="inactivos">Inactivos</SelectItem>
          </SelectContent>
        </Select>
        <Select value={verificadoFilter} onValueChange={(v) => setVerificadoFilter(v as "todos" | "verificados" | "no_verificados")}>
          <SelectTrigger className="w-auto min-w-[150px] h-auto py-2 bg-card border-border text-xs">
            <SelectValue placeholder="Verificación" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Verificados y no</SelectItem>
            <SelectItem value="verificados">Verificados</SelectItem>
            <SelectItem value="no_verificados">No verificados</SelectItem>
          </SelectContent>
        </Select>
        {hasActiveFilters && (
          <button onClick={clearFilters} className="text-xs font-medium text-muted-foreground hover:text-foreground underline underline-offset-2">
            Limpiar filtros
          </button>
        )}
      </div>

      {filtered.length > 0 ? (
        <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b border-border">
              <tr>
                <th className={thCls}>Usuario</th>
                <th className={thCls}>Correo</th>
                <th className={thCls}>Roles</th>
                <th className={thCls}>Estado</th>
                <th className={thCls}></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filtered.map(u => (
                <tr key={u.id_usuario} className="hover:bg-accent transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar
                        nombre={u.nombre_completo || u.username}
                        fotoUrl={resolveFotoUrl(u.foto_perfil)}
                        color="primary"
                        size="sm"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">
                          {u.nombre_completo || u.username}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">@{u.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                      {u.correo_electronico}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1 max-w-[220px]">
                      {u.roles.length > 0 ? u.roles.map(r => (
                        <span key={r} className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-accent text-primary">{r}</span>
                      )) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={u.activo ? "activo" : "inactivo"} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={() => onToggleActivo(u)}
                        title={u.activo ? "Desactivar" : "Activar"}
                        className={`p-1.5 rounded-lg transition-all ${u.activo ? "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30" : "text-muted-foreground hover:bg-muted"}`}
                      >
                        {u.activo ? <ShieldCheck className="w-4 h-4" /> : <ShieldOff className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => onDelete(u.id_usuario)}
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
          title="No se encontraron usuarios"
          description={usuarios.length === 0 ? "Crea el primer usuario para empezar." : "Prueba con otro término de búsqueda."}
        />
      )}

      <AdminModal
        open={modalOpen}
        onOpenChange={(o) => { if (!o) closeModal(); else setModalOpen(true); }}
        title="Crear usuario"
        maxWidth="sm:max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-3">
          {msg && (
            <div className="p-3 rounded-xl text-sm font-medium bg-destructive/10 text-destructive">
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
            {loading ? "Guardando..." : "Crear usuario"}
          </button>
        </form>
      </AdminModal>
    </div>
  );
}
