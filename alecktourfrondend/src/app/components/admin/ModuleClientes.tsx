import { useState } from "react";
import {
  Search, Trash2, Pencil, PlusCircle, Users, MapPin, Globe, Phone, Mail,
  Calendar, CreditCard, ChevronRight,
} from "lucide-react";
import type { SolicitudCancelacionResponse } from "../../services/solicitudCancelacion.service";
import { Cliente, Reserva, inputCls, labelCls, resolveFotoUrl } from "./types";
import AdminModal from "./ui/AdminModal";
import StatCard from "./ui/StatCard";
import SectionHeader from "./ui/SectionHeader";
import StatusBadge from "./ui/StatusBadge";
import EmptyState from "./ui/EmptyState";
import Avatar from "./ui/Avatar";
import Timeline, { type TimelineItem } from "./ui/Timeline";

const EMPTY_FORM = {
  nombre: "", apellido: "", cedula: "", correo: "",
  celular: "", direccion: "", ciudad: "", pais: "", fecha_nacimiento: "",
};

// Mismo criterio de fechas "puras" que ModuleReservas.tsx / ModuleCancelaciones.tsx.
const MESES_CORTOS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
function formatFechaCorta(iso?: string | null): string {
  if (!iso) return "—";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  const mesIdx = Number(m[2]) - 1;
  return `${m[3]} ${MESES_CORTOS[mesIdx] ?? m[2]} ${m[1]}`;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-border/50 last:border-0">
      <span className="text-xs text-muted-foreground min-w-[120px]">{label}</span>
      <span className="text-xs font-medium text-foreground text-right ml-auto">{value ?? "—"}</span>
    </div>
  );
}

interface Props {
  clientes: Cliente[];
  onDelete: (id: number) => void;
  onSubmit: (data: any, id?: number) => Promise<void>;
  loading: boolean;
  // Opcionales: si Admindashboard.tsx los pasa, el perfil del cliente
  // muestra su historial real de reservas y solicitudes de cancelación
  // (brief: "Clientes: full profiles"). Sin ellos, el perfil sigue
  // funcionando mostrando solo los datos propios del cliente — nunca se
  // inventa un historial si no llega la data.
  reservas?: Reserva[];
  solicitudes?: SolicitudCancelacionResponse[];
}

export default function ModuleClientes({
  clientes, onDelete, onSubmit, loading, reservas = [], solicitudes = [],
}: Props) {
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [profileId, setProfileId] = useState<number | null>(null);

  const filtered = clientes.filter(c =>
    `${c.nombre} ${c.apellido} ${c.cedula} ${c.correo}`.toLowerCase().includes(search.toLowerCase())
  );

  // KPIs reales — ciudades/países cubiertos por la base de clientes.
  const ciudades = new Set(clientes.map(c => c.ciudad).filter(Boolean));
  const paises = new Set(clientes.map(c => c.pais).filter(Boolean));

  const profile = clientes.find(c => c.id_cliente === profileId) ?? null;
  const reservasCliente = profile ? reservas.filter(r => r.id_cliente === profile.id_cliente) : [];
  const solicitudesCliente = profile
    ? solicitudes.filter(s => reservasCliente.some(r => r.id_reserva === s.id_reserva))
    : [];
  const totalGastado = reservasCliente
    .filter(r => r.estado !== "cancelada")
    .reduce((sum, r) => sum + (r.precio_total ?? 0), 0);

  const historialItems: TimelineItem[] = reservasCliente
    .slice()
    .sort((a, b) => new Date(b.fecha_inicio).getTime() - new Date(a.fecha_inicio).getTime())
    .map(r => ({
      id: r.id_reserva,
      badge: <StatusBadge status={r.estado} />,
      meta: `${r.hotel_nombre ?? r.destino ?? `Paquete #${r.id_paquete}`} · ${formatFechaCorta(r.fecha_inicio)} → ${formatFechaCorta(r.fecha_fin)}`,
      detail: r.precio_total != null ? `Total: $${r.precio_total.toLocaleString()}` : undefined,
    }));

  function openCreate() { setEditingId(null); setForm(EMPTY_FORM); setMsg(null); setModalOpen(true); }

  function openEdit(c: Cliente) {
    setEditingId(c.id_cliente);
    setForm({
      nombre: c.nombre, apellido: c.apellido, cedula: c.cedula, correo: c.correo ?? "",
      celular: c.celular ?? "", direccion: c.direccion ?? "", ciudad: c.ciudad ?? "",
      pais: c.pais ?? "", fecha_nacimiento: c.fecha_nacimiento ?? "",
    });
    setMsg(null);
    setModalOpen(true);
  }

  function closeModal() { setModalOpen(false); setEditingId(null); setForm(EMPTY_FORM); setMsg(null); }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    try {
      await onSubmit(form, editingId ?? undefined);
      closeModal();
    } catch (err: any) {
      setMsg({ type: "err", text: err.message || "Error al guardar cliente" });
    }
  };

  const thCls = "px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap";

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Clientes"
        subtitle={`${clientes.length} cliente${clientes.length === 1 ? "" : "s"} registrado${clientes.length === 1 ? "" : "s"}`}
        action={
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-[#A13B55] text-white rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-primary/20 transition-all"
          >
            <PlusCircle className="w-4 h-4" /> Nuevo cliente
          </button>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCard label="Total"    value={clientes.length} icon={Users} />
        <StatCard label="Ciudades" value={ciudades.size}   icon={MapPin}  gradient="from-[#C9A227] to-[#C9A227]" />
        <StatCard label="Países"   value={paises.size}     icon={Globe}   gradient="from-[#A13B55] to-[#A13B55]" />
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nombre, cédula o correo..."
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
                <th className={thCls}>Cliente</th>
                <th className={thCls}>Cédula</th>
                <th className={thCls}>Ubicación</th>
                <th className={thCls}>Contacto</th>
                <th className={thCls}></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filtered.map(c => (
                <tr
                  key={c.id_cliente}
                  className="hover:bg-accent transition-colors cursor-pointer group"
                  onClick={() => setProfileId(c.id_cliente)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar nombre={c.nombre} apellido={c.apellido} fotoUrl={resolveFotoUrl(c.foto_perfil)} color="primary" size="sm" />
                      <p className="text-xs font-semibold text-foreground truncate">{c.nombre} {c.apellido}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{c.cedula}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {[c.ciudad, c.pais].filter(Boolean).join(", ") || "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {c.correo && <p className="truncate max-w-[180px]">{c.correo}</p>}
                    {c.celular && <p>{c.celular}</p>}
                    {!c.correo && !c.celular && "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => openEdit(c)}
                        className="p-1.5 text-primary/60 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(c.id_cliente)}
                        className="p-1.5 text-destructive/60 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-1" />
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
          title="No se encontraron clientes"
          description={clientes.length === 0 ? "Registra el primer cliente para empezar." : "Prueba con otro término de búsqueda."}
        />
      )}

      {/* Modal de creación/edición */}
      <AdminModal
        open={modalOpen}
        onOpenChange={(o) => { if (!o) closeModal(); else setModalOpen(true); }}
        title={editingId ? "Editar cliente" : "Registrar cliente"}
        maxWidth="sm:max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-3">
          {msg && (
            <div className="p-3 rounded-xl text-sm font-medium bg-destructive/10 text-destructive">
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
            {loading ? "Guardando..." : editingId ? "Guardar cambios" : "Registrar cliente"}
          </button>
        </form>
      </AdminModal>

      {/* Perfil completo — brief: "Clientes: full profiles". Todo lo que
          muestra viene de datos reales que ya llegan por props (reservas,
          solicitudes); si Admindashboard no las pasa, simplemente no se
          muestra el historial, nunca se inventa. */}
      {profile && (
        <AdminModal
          open={!!profile}
          onOpenChange={(o) => { if (!o) setProfileId(null); }}
          title={
            <span className="inline-flex items-center gap-2.5">
              <Avatar nombre={profile.nombre} apellido={profile.apellido} fotoUrl={resolveFotoUrl(profile.foto_perfil)} color="primary" />
              {profile.nombre} {profile.apellido}
            </span>
          }
          description={`Cédula ${profile.cedula}`}
          maxWidth="sm:max-w-2xl"
        >
          <div className="grid sm:grid-cols-2 gap-6">
            <section>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Datos de contacto</h4>
              <div className="space-y-0.5">
                <Row label="Correo" value={profile.correo} />
                <Row label="Celular" value={profile.celular} />
                <Row label="Dirección" value={profile.direccion} />
                <Row label="Ciudad" value={[profile.ciudad, profile.pais].filter(Boolean).join(", ") || "—"} />
                <Row label="Nacimiento" value={formatFechaCorta(profile.fecha_nacimiento)} />
              </div>

              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mt-4 mb-2">Resumen</h4>
              <div className="space-y-0.5">
                <Row label="Reservas totales" value={reservasCliente.length} />
                <Row label="Total gastado" value={reservasCliente.length ? `$${totalGastado.toLocaleString()}` : "—"} />
                <Row label="Solicitudes de cancelación" value={solicitudesCliente.length} />
              </div>
            </section>

            <section>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Historial de reservas</h4>
              <div className="max-h-[340px] overflow-y-auto pr-1">
                <Timeline items={historialItems} emptyLabel="Este cliente todavía no tiene reservas registradas" />
              </div>
            </section>
          </div>
        </AdminModal>
      )}
    </div>
  );
}
