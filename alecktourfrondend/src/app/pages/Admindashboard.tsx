import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  PlusCircle, Hotel, Package, Users, Building2, Bell,
  ShieldCheck, Settings,
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
import { getLocalCache, setLocalCache } from "../utils/localCache";
import ModuleHoteles from "../components/admin/ModuleHoteles";
import ModulePaquetes from "../components/admin/ModulePaquetes";
import ModuleClientes from "../components/admin/ModuleClientes";
import ModuleUsuarios from "../components/admin/ModuleUsuarios";
import ModulePagos, { type MetodoPago } from "../components/admin/ModulePagos";
import ModuleActividad from "../components/admin/ModuleActividad";
import ModuleConfiguracion from "../components/admin/ModuleConfiguracion";
import AdminSidebar from "../components/admin/AdminSidebar";
import AdminHeader from "../components/admin/AdminHeader";
import ConfirmDialog from "../components/admin/ui/ConfirmDialog";
import EmptyState from "../components/admin/ui/EmptyState";
import type { QuickAction } from "../components/admin/ui/QuickActions";
import { usuarioAdminService } from "../services/usuarioAdmin.service";
import { solicitudCancelacionService, type SolicitudCancelacionResponse } from "../services/solicitudCancelacion.service";
import { reservaDetailService, type ActividadRecienteItem } from "../services/reserva.service";
import ModuleNotificaciones from "../components/admin/ModuleNotificaciones";
import { notificacionService, type NotificacionItem } from "../services/notificacion.service";
import ModuleEmpresas from "../components/admin/ModuleEmpresas";
import { empresaService, type SolicitudCorporativa } from "../services/empresa.service";

type PendingDelete =
  | { kind: "reserva"; id: number; label: string }
  | { kind: "hotel"; id: number; label: string }
  | { kind: "paquete"; id: number; label: string }
  | { kind: "cliente"; id: number; label: string }
  | { kind: "usuario"; id: number; label: string }
  | { kind: "pago"; id: number; label: string }
  | { kind: "empresa"; id: number; label: string };

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
  const [metodosPago, setMetodosPago] = useState<MetodoPago[]>([]);
  const [usuarios,  setUsuarios]  = useState<Usuario[]>([]);
  const [roles,     setRoles]     = useState<Rol[]>([]);
  const [solicitudes, setSolicitudes] = useState<SolicitudCancelacionResponse[]>([]);
  const [actividadReciente, setActividadReciente] = useState<ActividadRecienteItem[]>([]);
  const [actividadLimit, setActividadLimit] = useState(50);
  const [actividadLoading, setActividadLoading] = useState(false);
  const [actividadLoadingMore, setActividadLoadingMore] = useState(false);
  // true cuando la última carga trajo menos ítems que el límite pedido —
  // ya no queda más historial real por traer, no tiene sentido seguir
  // ofreciendo "Cargar más".
  const [actividadAgotado, setActividadAgotado] = useState(false);
  const [notificaciones, setNotificaciones] = useState<NotificacionItem[]>([]);
  const [notificacionesLoading, setNotificacionesLoading] = useState(false);
  const [solicitudesCorporativas, setSolicitudesCorporativas] = useState<SolicitudCorporativa[]>([]);

  // Conteo real de notificaciones no leídas (cancelaciones, contacto,
  // corporativo, pagos — ver Notificacion en notificacion_model.py),
  // derivado del mismo arreglo que alimenta el módulo — igual criterio que
  // pendingCancelaciones, una sola fuente de verdad.
  const notificacionesNoLeidas = notificaciones.filter(n => !n.leido).length;

  // Derivado del listado completo de solicitudes (una sola fuente de
  // verdad) en vez de un fetch aparte solo para el contador — la campana
  // de notificaciones y el módulo de Cancelaciones ya no pueden desincronizarse.
  const pendingCancelaciones = solicitudes.filter(s => s.estado === "pendiente").length;

  const [confirmDelete, setConfirmDelete] = useState<PendingDelete | null>(null);

  // Deep-link desde el Dashboard ("Reservas próximas" / "Actividad
  // reciente") hacia el detalle real de una reserva dentro del módulo
  // Reservas — ver ModuleReservas.reservaIdInicial.
  const [reservaParaAbrir, setReservaParaAbrir] = useState<number | null>(null);
  const verReserva = (id: number) => {
    setReservaParaAbrir(id);
    setActiveModule("reservas");
  };

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
    fetchMetodosPago();
    fetchUsuarios();
    fetchSolicitudes();
    fetchActividad(actividadLimit);
    fetchNotificaciones();
    fetchEmpresas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const fetchReservas  = async () => { try { setReservas(await apiFetch<Reserva[]>("/reservas?limit=100"));      } catch {} };
  // TTL de 120s: mismo valor que usa el backend para cachear estas listas en
  // Redis (GET /hoteles, /clientes) — no tiene sentido que el navegador
  // guarde una copia "más fresca" que la que el propio backend serviría.
  const ADMIN_CACHE_TTL = 120;
  const fetchHoteles   = async () => {
    const cached = getLocalCache<HotelData[]>("admin_cache_hoteles");
    if (cached) setHoteles(cached);
    try {
      const fresh = await apiFetch<HotelData[]>("/hoteles/?limit=300");
      setHoteles(fresh);
      setLocalCache("admin_cache_hoteles", fresh, ADMIN_CACHE_TTL);
    } catch {}
  };
  // incluir_inactivos=true: el admin necesita ver y poder reactivar los
  // paquetes desactivados (ver PaqueteRepository.get_all), a diferencia del
  // sitio público que solo debe listar los activos.
  const fetchPaquetes  = async () => {
    const cached = getLocalCache<Paquete[]>("admin_cache_paquetes");
    if (cached) setPaquetes(cached);
    try {
      const fresh = await apiFetch<Paquete[]>("/paquetes?limit=300&incluir_inactivos=true");
      setPaquetes(fresh);
      setLocalCache("admin_cache_paquetes", fresh, ADMIN_CACHE_TTL);
    } catch {}
  };
  const fetchClientes  = async () => {
    const cached = getLocalCache<Cliente[]>("admin_cache_clientes");
    if (cached) setClientes(cached);
    try {
      const fresh = await apiFetch<Cliente[]>("/clientes?limit=300");
      setClientes(fresh);
      setLocalCache("admin_cache_clientes", fresh, ADMIN_CACHE_TTL);
    } catch {}
  };
  const fetchEmpleados = async () => { try { setEmpleados(await apiFetch<Empleado[]>("/empleados?limit=100"));   } catch {} };
  const fetchPagos     = async () => { try { setPagos(await apiFetch<Pago[]>("/pagos?limit=300"));               } catch {} };
  const fetchMetodosPago = async () => { try { setMetodosPago(await apiFetch<MetodoPago[]>("/metodos-pago"));    } catch {} };
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

  // Feed real de actividad (historial_reservas de TODAS las reservas, ver
  // GET /historial-reservas/recientes) — alimenta tanto el widget chico del
  // Dashboard como el módulo completo de "Actividad del sistema".
  const fetchActividad = async (limit: number, esCargarMas = false) => {
    esCargarMas ? setActividadLoadingMore(true) : setActividadLoading(true);
    try {
      const data = await reservaDetailService.getActividadReciente(limit);
      setActividadReciente(data);
      setActividadAgotado(data.length < limit);
    } catch {
      // deja el feed como estaba (o vacío) — no es un dato crítico para
      // bloquear el resto del panel de admin.
    } finally {
      esCargarMas ? setActividadLoadingMore(false) : setActividadLoading(false);
    }
  };

  const cargarMasActividad = () => {
    const nuevoLimite = actividadLimit + 50;
    setActividadLimit(nuevoLimite);
    fetchActividad(nuevoLimite, true);
  };

  // Notificaciones reales (cancelaciones, contacto, solicitudes
  // corporativas, pagos aprobados) — ver notificacion_route.py.
  const fetchNotificaciones = async () => {
    setNotificacionesLoading(true);
    try { setNotificaciones(await notificacionService.getAll()); } catch {} finally { setNotificacionesLoading(false); }
  };

  const marcarNotificacionLeida = async (id: number) => {
    try {
      await notificacionService.marcarLeida(id);
      setNotificaciones(prev => prev.map(n => n.id_notificacion === id ? { ...n, leido: true } : n));
    } catch (e: any) {
      toast.error(e?.message || "No se pudo marcar como leída");
    }
  };

  const marcarTodasNotificacionesLeidas = async () => {
    try {
      await notificacionService.marcarTodasLeidas();
      setNotificaciones(prev => prev.map(n => ({ ...n, leido: true })));
    } catch (e: any) {
      toast.error(e?.message || "No se pudieron marcar todas como leídas");
    }
  };

  const deleteNotificacion = async (id: number) => {
    try {
      await notificacionService.delete(id);
      setNotificaciones(prev => prev.filter(n => n.id_notificacion !== id));
    } catch (e: any) {
      toast.error(e?.message || "No se pudo eliminar la notificación");
    }
  };

  // Solicitudes corporativas reales — cada una llegó desde el formulario
  // público de /corporate (ver empresa_model.py / Corporate.tsx).
  const fetchEmpresas = async () => {
    try { setSolicitudesCorporativas(await empresaService.getAll()); } catch {}
  };

  const updateEstadoEmpresa = async (id: number, estado: SolicitudCorporativa["estado"]) => {
    try {
      const actualizado = await empresaService.actualizarEstado(id, estado);
      setSolicitudesCorporativas(prev => prev.map(s => s.id_solicitud === id ? actualizado : s));
      toast.success("Estado actualizado");
    } catch (e: any) {
      toast.error(e?.message || "No se pudo actualizar el estado");
      throw e;
    }
  };

  const deleteEmpresa = (id: number) => setConfirmDelete({ kind: "empresa", id, label: "esta solicitud corporativa" });

  // ─── Eliminar (ahora vía ConfirmDialog centrado, no window.confirm) ──────
  const deleteReserva = (id: number) => setConfirmDelete({ kind: "reserva", id, label: `la reserva #${id}` });
  const deleteHotel   = (id: number) => setConfirmDelete({ kind: "hotel", id, label: "este hotel" });
  const deletePaquete = (id: number) => setConfirmDelete({ kind: "paquete", id, label: "este paquete" });
  const deleteCliente = (id: number) => setConfirmDelete({ kind: "cliente", id, label: "este cliente" });
  const deleteUsuario = (id: number) => setConfirmDelete({ kind: "usuario", id, label: "este usuario" });
  const deletePago    = (id: number) => setConfirmDelete({ kind: "pago", id, label: `el pago #${id}` });

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
      } else if (kind === "pago") {
        await apiFetch(`/pagos/${id}`, { method: "DELETE" });
        await fetchPagos();
        toast.success("Pago eliminado correctamente");
      } else if (kind === "empresa") {
        await empresaService.delete(id);
        await fetchEmpresas();
        toast.success("Solicitud eliminada correctamente");
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

  const updatePagoEstado = async (id: number, estado: string) => {
    try {
      // Se guarda la respuesta completa (no solo el estado local) porque el
      // backend puede asignar numero_factura automáticamente en este mismo
      // PUT (ver _asignar_numero_factura en reserva_route.py) — con un merge
      // parcial esa factura nueva no aparecería hasta refrescar la página.
      const actualizado = await apiFetch<Pago>(`/pagos/${id}`, { method: "PUT", body: { estado } });
      setPagos(prev => prev.map(p => p.id_pago === id ? { ...p, ...actualizado } : p));
      toast.success("Estado del pago actualizado");
    } catch (e: any) {
      toast.error(e?.message || "No se pudo actualizar el estado del pago");
      throw e;
    }
  };

  // Comprobante externo (voucher de transferencia/consignación) adjunto a
  // un pago — sube/borra el archivo real en el backend, sin inventar nada.
  const uploadComprobantePago = async (id: number, file: File) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      const actualizado = await apiFetch<Pago>(`/pagos/${id}/comprobante`, { method: "POST", body: formData });
      setPagos(prev => prev.map(p => p.id_pago === id ? { ...p, ...actualizado } : p));
      toast.success("Comprobante adjuntado correctamente");
    } catch (e: any) {
      toast.error(e?.message || "No se pudo subir el comprobante");
      throw e;
    }
  };

  const deleteComprobantePago = async (id: number) => {
    try {
      const actualizado = await apiFetch<Pago>(`/pagos/${id}/comprobante`, { method: "DELETE" });
      setPagos(prev => prev.map(p => p.id_pago === id ? { ...p, ...actualizado } : p));
      toast.success("Comprobante eliminado");
    } catch (e: any) {
      toast.error(e?.message || "No se pudo eliminar el comprobante");
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
      <ModuleDashboard setActiveModule={setActiveModule} onVerReserva={verReserva} />
    ),
    reservas: (
      <ModuleReservas
        reservas={reservas} clientes={clientes} empleados={empleados}
        paquetes={paquetes} pagos={pagos} solicitudes={solicitudes}
        onDelete={deleteReserva}
        onNueva={() => setActiveModule("crear-reserva")}
        onUpdateEstado={updateEstadoReserva}
        reservaIdInicial={reservaParaAbrir}
      />
    ),
    "crear-reserva": (
      <ModuleCrearReserva clientes={clientes} paquetes={paquetes} hoteles={hoteles} onSubmit={submitReserva} loading={loading} />
    ),
    hoteles: (
      <ModuleHoteles hoteles={hoteles} onDelete={deleteHotel} onSubmit={submitHotel} loading={loading} />
    ),
    paquetes: (
      <ModulePaquetes paquetes={paquetes} reservas={reservas} onDelete={deletePaquete} onSubmit={submitPaquete} loading={loading} />
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
        onVerReserva={verReserva}
      />
    ),
    empresas: (
      <ModuleEmpresas
        solicitudes={solicitudesCorporativas}
        clientes={clientes}
        onUpdateEstado={updateEstadoEmpresa}
        onDelete={deleteEmpresa}
      />
    ),
    pagos: (
      <ModulePagos
        pagos={pagos} reservas={reservas} clientes={clientes} metodos={metodosPago}
        onUpdateEstado={updatePagoEstado} onDelete={deletePago}
        onUploadComprobante={uploadComprobantePago} onDeleteComprobante={deleteComprobantePago}
      />
    ),
    notificaciones: (
      <ModuleNotificaciones
        notificaciones={notificaciones}
        loading={notificacionesLoading}
        onMarcarLeida={marcarNotificacionLeida}
        onMarcarTodasLeidas={marcarTodasNotificacionesLeidas}
        onDelete={deleteNotificacion}
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
      <ModuleActividad
        actividad={actividadReciente}
        loading={actividadLoading}
        loadingMore={actividadLoadingMore}
        agotado={actividadAgotado}
        onCargarMas={cargarMasActividad}
      />
    ),
    configuracion: <ModuleConfiguracion />,
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
        usuarioFoto={usuario?.foto_perfil}
        onLogout={handleLogout}
        pendingCancelaciones={pendingCancelaciones}
        notificacionesNoLeidas={notificacionesNoLeidas}
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
