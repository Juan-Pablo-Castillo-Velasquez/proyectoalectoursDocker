import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  PlusCircle, Hotel, Package, Users, Building2, Wallet, Bell,
  ShieldCheck, Activity, Settings,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../api/v1/api";
import { Reserva, HotelData, Paquete, Cliente, Empleado, Pago, Usuario, Rol, Module } from "../components/admin/types";
import ModuleDashboard from "../components/admin/ModuleDashboard";
import ModuleReservas from "../components/admin/ModuleReservas";
import ModuleCancelaciones from "../components/admin/ModuleCancelaciones";
import ModuleCrearReserva from "../components/admin/ModuleCrearReserva";
import ModuleHoteles from "../components/admin/ModuleHoteles";
import ModulePaquetes from "../components/admin/ModulePaquetes";
import ModuleClientes from "../components/admin/ModuleClientes";
import ModuleUsuarios from "../components/admin/ModuleUsuarios";
import AdminSidebar from "../components/admin/AdminSidebar";
import AdminHeader from "../components/admin/AdminHeader";
import ConfirmDialog from "../components/admin/ui/ConfirmDialog";
import EmptyState from "../components/admin/ui/EmptyState";
import type { QuickAction } from "../components/admin/ui/QuickActions";
import { usuarioAdminService } from "../services/usuarioAdmin.service";
import { solicitudCancelacionService, type SolicitudCancelacionResponse } from "../services/solicitudCancelacion.service";

type PendingDelete =
  | { kind: "reserva"; id: number; label: string }
  | { kind: "hotel"; id: number; label: string }
  | { kind: "paquete"; id: number; label: string }
  | { kind: "cliente"; id: number; label: string }
  | { kind: "usuario"; id: number; label: string };

export default function AdminDashboard() {
  const { usuario, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [activeModule, setActiveModule] = useState<Module>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [dark, setDark] = useState(() => localStorage.getItem("admin-theme") === "dark");

  const [reservas,  setReservas]  = useState<Reserva[]>([]);
  const [hoteles,   setHoteles]   = useState<HotelData[]>([]);
  const [paquetes,  setPaquetes]  = useState<Paquete[]>([]);
  const [clientes,  setClientes]  = useState<Cliente[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [pagos,     setPagos]     = useState<Pago[]>([]);
  const [usuarios,  setUsuarios]  = useState<Usuario[]>([]);
  const [roles,     setRoles]     = useState<Rol[]>([]);
  const [solicitudes, setSolicitudes] = useState<SolicitudCancelacionResponse[]>([]);

  // Derivado del listado completo de solicitudes (una sola fuente de
  // verdad) en vez de un fetch aparte solo para el contador — la campana
  // de notificaciones y el módulo de Cancelaciones ya no pueden desincronizarse.
  const pendingCancelaciones = solicitudes.filter(s => s.estado === "pendiente").length;

  const [confirmDelete, setConfirmDelete] = useState<PendingDelete | null>(null);

  // ─── Dark mode via clase en <html> ───────────────────────────────────────
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("admin-theme", dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => { if (!isAdmin) navigate("/"); }, [isAdmin]);

  // Antes cada dataset se pedía solo al entrar a su pestaña (ej. "clientes"
  // y "paquetes" no se cargaban al abrir el Dashboard), así que el
  // Dashboard podía mostrar "0 clientes" / "0 paquetes" en la primera
  // visita hasta pasar por esas pestañas. Ahora se cargan todos una sola
  // vez al entrar al panel: el Dashboard queda correcto desde el primer
  // render y el buscador global del header tiene datos reales desde ya.
  useEffect(() => {
    if (!isAdmin) return;
    fetchReservas();
    fetchHoteles();
    fetchPaquetes();
    fetchClientes();
    fetchEmpleados();
    fetchPagos();
    fetchUsuarios();
    fetchSolicitudes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const fetchReservas  = async () => { try { setReservas(await apiFetch<Reserva[]>("/reservas?limit=100"));      } catch {} };
  const fetchHoteles   = async () => { try { setHoteles(await apiFetch<HotelData[]>("/hoteles/?limit=100"));     } catch {} };
  // incluir_inactivos=true: el admin necesita ver y poder reactivar los
  // paquetes desactivados (ver PaqueteRepository.get_all), a diferencia del
  // sitio público que solo debe listar los activos.
  const fetchPaquetes  = async () => { try { setPaquetes(await apiFetch<Paquete[]>("/paquetes?limit=100&incluir_inactivos=true")); } catch {} };
  const fetchClientes  = async () => { try { setClientes(await apiFetch<Cliente[]>("/clientes?limit=100"));      } catch {} };
  const fetchEmpleados = async () => { try { setEmpleados(await apiFetch<Empleado[]>("/empleados?limit=100"));   } catch {} };
  const fetchPagos     = async () => { try { setPagos(await apiFetch<Pago[]>("/pagos?limit=100"));               } catch {} };
  const fetchUsuarios  = async () => {
    try {
      const [u, r] = await Promise.all([usuarioAdminService.getAll(), usuarioAdminService.getRoles()]);
      setUsuarios(u); setRoles(r);
    } catch {}
  };
  // Todas las solicitudes de cancelación (no solo pendientes) — el módulo
  // de Cancelaciones necesita ver también las ya resueltas, y de acá se
  // deriva `pendingCancelaciones` para la campana del header.
  const fetchSolicitudes = async () => {
    try { setSolicitudes(await solicitudCancelacionService.getAll()); } catch {}
  };

  // ─── Eliminar (ahora vía ConfirmDialog centrado, no window.confirm) ──────
  const deleteReserva = (id: number) => setConfirmDelete({ kind: "reserva", id, label: `la reserva #${id}` });
  const deleteHotel   = (id: number) => setConfirmDelete({ kind: "hotel", id, label: "este hotel" });
  const deletePaquete = (id: number) => setConfirmDelete({ kind: "paquete", id, label: "este paquete" });
  const deleteCliente = (id: number) => setConfirmDelete({ kind: "cliente", id, label: "este cliente" });
  const deleteUsuario = (id: number) => setConfirmDelete({ kind: "usuario", id, label: "este usuario" });

  const executeDelete = async () => {
    if (!confirmDelete) return;
    const { kind, id } = confirmDelete;
    try {
      if (kind === "reserva") {
        await apiFetch(`/reservas/${id}`, { method: "DELETE" });
        await fetchReservas();
        toast.success("Reserva eliminada correctamente");
      } else if (kind === "hotel") {
        await apiFetch(`/hoteles/${id}`, { method: "DELETE" });
        await fetchHoteles();
        toast.success("Hotel eliminado correctamente");
      } else if (kind === "paquete") {
        await apiFetch(`/paquetes/${id}`, { method: "DELETE" });
        await fetchPaquetes();
        toast.success("Paquete desactivado correctamente");
      } else if (kind === "cliente") {
        await apiFetch(`/clientes/${id}`, { method: "DELETE" });
        await fetchClientes();
        toast.success("Cliente eliminado correctamente");
      } else if (kind === "usuario") {
        await usuarioAdminService.delete(id);
        await fetchUsuarios();
        toast.success("Usuario eliminado correctamente");
      }
    } catch (e: any) {
      toast.error(e?.message || "No se pudo completar la eliminación");
      throw e;
    }
  };

  const updateEstadoReserva = async (id: number, estado: string) => {
    try {
      await apiFetch(`/reservas/${id}`, { method: "PUT", body: { estado } });
      setReservas(prev => prev.map(r => r.id_reserva === id ? { ...r, estado } : r));
      toast.success("Estado de la reserva actualizado");
    } catch (e: any) {
      toast.error(e?.message || "No se pudo actualizar el estado de la reserva");
      throw e;
    }
  };

  const resolverSolicitud = async (id: number, data: { estado: "aprobada" | "rechazada"; comentario_resolucion: string }) => {
    try {
      await solicitudCancelacionService.resolver(id, data);
      await fetchSolicitudes();
      // Aprobar cancela de verdad la reserva vinculada (ver
      // solicitud_cancelacion_route.py) — refrescamos Reservas para que no
      // quede con el estado viejo en caché en otras pestañas del panel.
      if (data.estado === "aprobada") await fetchReservas();
      toast.success(
        data.estado === "aprobada"
          ? "Solicitud aprobada — la reserva quedó cancelada"
          : "Solicitud rechazada"
      );
    } catch (e: any) {
      toast.error(e?.message || "No se pudo resolver la solicitud");
      throw e;
    }
  };

  const submitReserva = async (data: any) => {
    setLoading(true);
    try {
      await apiFetch("/reservas", { method: "POST", body: data });
      await fetchReservas();
      toast.success("Reserva creada correctamente");
    } catch (e: any) {
      toast.error(e?.message || "No se pudo crear la reserva");
      throw e;
    } finally { setLoading(false); }
  };
  const submitHotel = async (data: any, id?: number) => {
    setLoading(true);
    try {
      if (id) await apiFetch(`/hoteles/${id}`, { method: "PUT", body: data });
      else await apiFetch("/hoteles/", { method: "POST", body: data });
      await fetchHoteles();
      toast.success(id ? "Hotel actualizado correctamente" : "Hotel creado correctamente");
    } catch (e: any) {
      toast.error(e?.message || "No se pudo guardar el hotel");
      throw e;
    } finally { setLoading(false); }
  };
  const submitPaquete = async (data: any, id?: number) => {
    setLoading(true);
    try {
      if (id) await apiFetch(`/paquetes/${id}`, { method: "PUT", body: data });
      else await apiFetch("/paquetes", { method: "POST", body: data });
      await fetchPaquetes();
      toast.success(id ? "Paquete actualizado correctamente" : "Paquete creado correctamente");
    } catch (e: any) {
      toast.error(e?.message || "No se pudo guardar el paquete");
      throw e;
    } finally { setLoading(false); }
  };
  const submitCliente = async (data: any, id?: number) => {
    setLoading(true);
    try {
      if (id) await apiFetch(`/clientes/${id}`, { method: "PUT", body: data });
      else await apiFetch("/clientes", { method: "POST", body: data });
      await fetchClientes();
      toast.success(id ? "Cliente actualizado correctamente" : "Cliente creado correctamente");
    } catch (e: any) {
      toast.error(e?.message || "No se pudo guardar el cliente");
      throw e;
    } finally { setLoading(false); }
  };

  const submitUsuario = async (data: any) => {
    setLoading(true);
    try {
      await usuarioAdminService.create(data);
      await fetchUsuarios();
      toast.success("Usuario creado correctamente");
    } catch (e: any) {
      toast.error(e?.message || "No se pudo crear el usuario");
      throw e;
    } finally { setLoading(false); }
  };
  const toggleActivoUsuario = async (usuarioObj: Usuario) => {
    try {
      await usuarioAdminService.update(usuarioObj.id_usuario, { activo: !usuarioObj.activo });
      setUsuarios(prev => prev.map(u => u.id_usuario === usuarioObj.id_usuario ? { ...u, activo: !u.activo } : u));
      toast.success(usuarioObj.activo ? "Usuario desactivado" : "Usuario activado");
    } catch (e: any) {
      toast.error(e?.message || "No se pudo actualizar el usuario");
      throw e;
    }
  };

  const handleLogout = () => { logout(); navigate("/"); };

  // Accesos rápidos globales, visibles desde cualquier módulo (header) —
  // ver AdminHeader.tsx / ui/QuickActions.tsx.
  const quickActions: QuickAction[] = [
    { label: "Nueva reserva",    icon: PlusCircle, onClick: () => setActiveModule("crear-reserva") },
    { label: "Registrar hotel",  icon: Hotel,      onClick: () => setActiveModule("hoteles") },
    { label: "Crear paquete",    icon: Package,    onClick: () => setActiveModule("paquetes") },
    { label: "Ver clientes",     icon: Users,      onClick: () => setActiveModule("clientes") },
  ];

  const MODULES: Record<Module, React.ReactNode> = {
    dashboard: (
      <ModuleDashboard
        reservas={reservas} hoteles={hoteles} paquetes={paquetes}
        clientes={clientes} setActiveModule={setActiveModule}
        pendingCancelaciones={pendingCancelaciones}
      />
    ),
    reservas: (
      <ModuleReservas
        reservas={reservas} clientes={clientes} empleados={empleados}
        paquetes={paquetes} pagos={pagos}
        onDelete={deleteReserva}
        onNueva={() => setActiveModule("crear-reserva")}
        onUpdateEstado={updateEstadoReserva}
      />
    ),
    "crear-reserva": (
      <ModuleCrearReserva clientes={clientes} paquetes={paquetes} onSubmit={submitReserva} loading={loading} />
    ),
    hoteles: (
      <ModuleHoteles hoteles={hoteles} onDelete={deleteHotel} onSubmit={submitHotel} loading={loading} />
    ),
    paquetes: (
      <ModulePaquetes paquetes={paquetes} onDelete={deletePaquete} onSubmit={submitPaquete} loading={loading} />
    ),
    clientes: (
      <ModuleClientes
        clientes={clientes} onDelete={deleteCliente} onSubmit={submitCliente} loading={loading}
        reservas={reservas} solicitudes={solicitudes}
      />
    ),
    usuarios: (
      <ModuleUsuarios
        usuarios={usuarios} roles={roles}
        onDelete={deleteUsuario} onSubmit={submitUsuario}
        onToggleActivo={toggleActivoUsuario} loading={loading}
      />
    ),
    cancelaciones: (
      <ModuleCancelaciones
        solicitudes={solicitudes}
        clientes={clientes}
        empleados={empleados}
        reservas={reservas}
        onResolve={resolverSolicitud}
      />
    ),
    // ─── Módulos de la nueva estructura de navegación, todavía sin
    // pantalla propia construida (llegan en las próximas fases del
    // rediseño). Se muestran con un estado vacío honesto, nunca con datos
    // inventados — ver EmptyState.tsx.
    empresas: (
      <EmptyState
        icon={Building2}
        title="Empresas y contactos"
        description="Este módulo de CRM comercial (empresas, contactos, seguimiento) requiere datos que hoy no existen en la base de datos — se habilitará en una próxima actualización, cuando se defina qué información nueva hay que guardar."
      />
    ),
    pagos: (
      <EmptyState
        icon={Wallet}
        title="Centro de pagos"
        description="La vista dedicada de pagos (recaudo total, pendientes, transacciones recientes) se habilita en una próxima actualización. Mientras tanto, los ingresos y pagos ya se resumen en el Dashboard."
      />
    ),
    notificaciones: (
      <EmptyState
        icon={Bell}
        title="Centro de notificaciones"
        description="El panel de notificaciones (nuevas reservas, cancelaciones, pagos, contactos) se habilita en una próxima actualización."
      />
    ),
    roles: (
      <EmptyState
        icon={ShieldCheck}
        title="Roles y permisos"
        description="La gestión detallada de permisos por rol se habilita en una próxima actualización. Los roles de cada usuario ya pueden asignarse desde Usuarios."
      />
    ),
    actividad: (
      <EmptyState
        icon={Activity}
        title="Actividad del sistema"
        description="El registro completo de actividad del sistema se habilita en una próxima actualización."
      />
    ),
    configuracion: (
      <EmptyState
        icon={Settings}
        title="Configuración"
        description="Las opciones de configuración general del panel se habilitan en una próxima actualización."
      />
    ),
  };

  const usuarioInicial = usuario?.username?.[0]?.toUpperCase() ?? "A";

  return (
    <div className="min-h-screen bg-background flex flex-col transition-colors duration-300">
      <AdminHeader
        activeModule={activeModule}
        onToggleSidebar={() => setSidebarOpen(s => !s)}
        sidebarOpen={sidebarOpen}
        dark={dark}
        onToggleDark={() => setDark(d => !d)}
        usuarioNombre={usuario?.username}
        onLogout={handleLogout}
        pendingCancelaciones={pendingCancelaciones}
        quickActions={quickActions}
        onNavigate={setActiveModule}
        searchData={{ reservas, hoteles, paquetes, clientes, usuarios }}
      />

      <div className="flex flex-1 overflow-hidden">
        <AdminSidebar
          activeModule={activeModule}
          setActiveModule={setActiveModule}
          open={sidebarOpen}
          usuarioInicial={usuarioInicial}
          usuarioNombre={usuario?.username}
        />

        {/* ── Main content ─────────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 transition-colors duration-300 bg-background">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeModule}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="max-w-7xl mx-auto"
            >
              {MODULES[activeModule]}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* DELETE /paquetes/{id} nunca borra de verdad — solo pone activo=false
          (ver PaqueteRepository.delete), así que para ese caso el diálogo
          usa un texto honesto ("desactivar", reversible) en vez del genérico
          "eliminar" que sí aplica a reserva/hotel/cliente/usuario. */}
      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(open) => { if (!open) setConfirmDelete(null); }}
        title={confirmDelete?.kind === "paquete" ? "Confirmar desactivación" : "Confirmar eliminación"}
        description={
          confirmDelete
            ? confirmDelete.kind === "paquete"
              ? `¿Seguro que quieres desactivar ${confirmDelete.label}? Dejará de verse en el sitio público, pero podrás reactivarlo cuando quieras.`
              : `¿Seguro que quieres eliminar ${confirmDelete.label}? Esta acción no se puede deshacer.`
            : undefined
        }
        confirmLabel={confirmDelete?.kind === "paquete" ? "Desactivar" : "Eliminar"}
        destructive
        onConfirm={executeDelete}
      />
    </div>
  );
}
