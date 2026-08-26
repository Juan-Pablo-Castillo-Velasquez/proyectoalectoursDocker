import { useEffect, useState } from "react";
import {
  CalendarDays, Clock, CheckCircle, Hotel,
  PlusCircle, Package, Users, TrendingUp,
  DollarSign, ArrowUpRight, AlertCircle, XCircle,
  Inbox, Activity,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
  AreaChart, Area
} from "recharts";
import { Reserva, HotelData, Paquete, Cliente } from "./types";
import { apiFetch } from "../../api/v1/api";
import { reservaDetailService, type ActividadRecienteItem } from "../../services/reserva.service";
import StatusBadge from "./ui/StatusBadge";

interface Pago {
  id_pago: number;
  id_reserva: number;
  monto: number;
  estado: string;
  fecha_pago: string;
  metodo_pago: { id_metodo: number; nombre_metodo: string };
}

interface Props {
  reservas: Reserva[];
  hoteles: HotelData[];
  paquetes: Paquete[];
  clientes: Cliente[];
  setActiveModule: (m: any) => void;
  /** Conteo real de solicitudes de cancelación pendientes (ver Admindashboard.tsx) */
  pendingCancelaciones: number;
}

// Formato relativo simple ("Hace 5 min", "Ayer") para el feed de actividad
// reciente — sin librerías nuevas, solo Date nativo.
function tiempoRelativo(fechaISO: string): string {
  const fecha = new Date(fechaISO).getTime();
  if (Number.isNaN(fecha)) return "";
  const diffMin = Math.floor((Date.now() - fecha) / 60000);
  if (diffMin < 1) return "Hace un momento";
  if (diffMin < 60) return `Hace ${diffMin} min`;
  const diffHoras = Math.floor(diffMin / 60);
  if (diffHoras < 24) return `Hace ${diffHoras} h`;
  const diffDias = Math.floor(diffHoras / 24);
  if (diffDias === 1) return "Ayer";
  if (diffDias < 30) return `Hace ${diffDias} días`;
  return new Date(fechaISO).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
}

// Paleta brand AlekTours: granate, dorado, oscuro, crema, rosa
const COLORS = ["#7B1E3A", "#C9A227", "#2E2E2E", "#A13B55", "#E6D3C5", "#a83255", "#c9a227", "#7b1e3a"];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#2E2E2E] text-white px-3 py-2 rounded-lg text-xs shadow-xl">
        <p className="font-semibold mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color }}>
            {p.name}: {typeof p.value === "number" && p.value > 10000
              ? `$${p.value.toLocaleString("es-CO")}`
              : p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function ModuleDashboard({ reservas, hoteles, paquetes, clientes, setActiveModule, pendingCancelaciones }: Props) {
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [actividad, setActividad] = useState<ActividadRecienteItem[]>([]);

  useEffect(() => {
    apiFetch<Pago[]>("/pagos?limit=100").then(setPagos).catch(() => {});
    reservaDetailService.getActividadReciente(12).then(setActividad).catch(() => {});
  }, []);

  // --- KPIs ---
  const totalIngresos = pagos.reduce((a, p) => a + p.monto, 0);
  const pagosPendientes = pagos.filter(p => p.estado === "pendiente").length;
  const confirmadas = reservas.filter(r => r.estado === "confirmada").length;
  const pendientes = reservas.filter(r => r.estado === "pendiente").length;
  const canceladas = reservas.filter(r => r.estado === "cancelada").length;
  const finalizadas = reservas.filter(r => r.estado === "finalizada").length;

  // --- Pie estado ---
  const estadoData = [
    { name: "Pendiente",  value: pendientes,  color: "#C9A227" },
    { name: "Confirmada", value: confirmadas, color: "#7B1E3A" },
    { name: "Cancelada",  value: canceladas,  color: "#2E2E2E" },
    { name: "Finalizada", value: finalizadas, color: "#A13B55" },
  ].filter(d => d.value > 0);

  // --- Paquetes más reservados ---
  const paqueteCount: Record<number, number> = {};
  reservas.forEach(r => {
    if (r.id_paquete) paqueteCount[r.id_paquete] = (paqueteCount[r.id_paquete] || 0) + 1;
  });
  const paquetesData = Object.entries(paqueteCount)
    .map(([id, count]) => ({
      name: paquetes.find(p => p.id_paquete === parseInt(id))?.nombre_paquete?.split(" ").slice(0, 3).join(" ") || `Paquete #${id}`,
      reservas: count,
      ingresos: pagos
        .filter(p => reservas.find(r => r.id_reserva === p.id_reserva && r.id_paquete === parseInt(id)))
        .reduce((a, p) => a + p.monto, 0),
    }))
    .sort((a, b) => b.reservas - a.reservas);

  // --- Hoteles más reservados (Reserva.hotel_nombre, ya calculado en el
  // backend — ver Reserva._primer_hotel / Reserva.hotel_nombre) ---
  const hotelCount: Record<string, number> = {};
  reservas.forEach(r => {
    if (r.hotel_nombre) hotelCount[r.hotel_nombre] = (hotelCount[r.hotel_nombre] || 0) + 1;
  });
  const hotelesData = Object.entries(hotelCount)
    .map(([name, count]) => ({ name, reservas: count }))
    .sort((a, b) => b.reservas - a.reservas)
    .slice(0, 8);

  // --- Pagos por método ---
  const metodoData: Record<string, number> = {};
  pagos.forEach(p => {
    const nombre = p.metodo_pago?.nombre_metodo || "Otro";
    metodoData[nombre] = (metodoData[nombre] || 0) + p.monto;
  });
  const metodosChart = Object.entries(metodoData)
    .map(([name, monto]) => ({ name, monto }))
    .sort((a, b) => b.monto - a.monto);

  // --- Actividad por fecha de check-in ---
  const actividadDias: Record<string, number> = {};
  reservas.forEach(r => {
    if (r.fecha_inicio) {
      const dia = new Date(r.fecha_inicio).toLocaleDateString("es-CO", { day: "2-digit", month: "short" });
      actividadDias[dia] = (actividadDias[dia] || 0) + 1;
    }
  });
  const actividadData = Object.entries(actividadDias).map(([dia, total]) => ({ dia, total }));

  const totalPersonas = reservas.reduce((a, r) => a + r.numero_personas, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
          <p className="text-muted-foreground text-sm mt-0.5">Análisis en tiempo real · AlekTours</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#f1e4e8] border border-[rgba(123,30,58,0.2)] rounded-full">
          <div className="w-2 h-2 bg-[#7B1E3A] rounded-full animate-pulse" />
          <span className="text-xs font-medium text-[#7B1E3A]">Sistema activo</span>
        </div>
      </div>

      {/* KPI Row 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Reservas",
            value: reservas.length,
            icon: CalendarDays,
            gradient: "from-[#7B1E3A] to-[#A13B55]",
            sub: `${totalPersonas} personas viajando`,
            subColor: "text-[#A13B55]",
          },
          {
            label: "Pendientes",
            value: pendientes,
            icon: Clock,
            gradient: "from-[#C9A227] to-[#e6b830]",
            sub: `${pagosPendientes} pagos por confirmar`,
            subColor: "text-[#C9A227]",
          },
          {
            label: "Ingresos totales",
            value: `$${(totalIngresos / 1000000).toFixed(1)}M`,
            icon: DollarSign,
            gradient: "from-[#2E2E2E] to-[#555555]",
            sub: `${pagos.length} transacciones`,
            subColor: "text-[#555555]",
          },
          {
            label: "Tasa ocupación",
            value: `${reservas.length ? Math.round(((confirmadas + finalizadas) / reservas.length) * 100) : 0}%`,
            icon: TrendingUp,
            gradient: "from-[#A13B55] to-[#7B1E3A]",
            sub: "Confirmadas + finalizadas",
            subColor: "text-[#7B1E3A]",
          },
        ].map(({ label, value, icon: Icon, gradient, sub, subColor }) => (
          <div key={label} className="bg-card rounded-2xl p-5 shadow-sm border border-border hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-3xl font-bold text-foreground mb-0.5">{value}</p>
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className={`text-xs mt-1 font-medium ${subColor}`}>{sub}</p>
          </div>
        ))}
      </div>

      {/* KPI Row 2 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: "Hoteles activos",   value: hoteles.length,                         icon: Hotel,        color: "from-[#7B1E3A] to-[#A13B55]" },
          { label: "Paquetes activos",  value: paquetes.filter(p => p.activo).length,  icon: Package,      color: "from-[#A13B55] to-[#7B1E3A]" },
          { label: "Clientes",          value: clientes.length,                         icon: Users,        color: "from-[#C9A227] to-[#e6b830]" },
          { label: "Confirmadas",       value: confirmadas,                             icon: CheckCircle,  color: "from-[#2E2E2E] to-[#555555]" },
          { label: "Canceladas",        value: canceladas,                              icon: XCircle,      color: "from-[#c62828] to-[#8f1d1d]" },
          { label: "Solicitudes pendientes", value: pendingCancelaciones,               icon: Inbox,        color: "from-[#C9A227] to-[#7B1E3A]" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-card rounded-2xl p-5 shadow-sm border border-border flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center flex-shrink-0 shadow-sm`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pie estado */}
        <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-foreground">Estado de reservas</h3>
              <p className="text-xs text-muted-foreground">Distribución actual</p>
            </div>
            <span className="text-xs bg-[#f1e4e8] text-[#7B1E3A] px-2 py-1 rounded-full font-medium">
              {reservas.length} total
            </span>
          </div>
          {estadoData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={estadoData} cx="50%" cy="45%" outerRadius={75} innerRadius={40} dataKey="value" paddingAngle={3}>
                  {estadoData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-muted-foreground flex-col gap-2">
              <AlertCircle className="w-8 h-8" />
              <p className="text-sm">Sin datos</p>
            </div>
          )}
        </div>

        {/* Area actividad */}
        <div className="bg-card rounded-2xl p-6 shadow-sm border border-border lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-foreground">Actividad de reservas</h3>
              <p className="text-xs text-muted-foreground">Por fecha de check-in</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={actividadData}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#7B1E3A" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#7B1E3A" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(123,30,58,0.08)" />
              <XAxis dataKey="dia" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="total"
                name="Reservas"
                stroke="#7B1E3A"
                strokeWidth={2.5}
                fill="url(#colorTotal)"
                dot={{ fill: "#7B1E3A", r: 4 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar paquetes */}
        <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-foreground">Paquetes más reservados</h3>
              <p className="text-xs text-muted-foreground">Por número de reservas</p>
            </div>
          </div>
          {paquetesData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={paquetesData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(123,30,58,0.08)" />
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={100} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="reservas" name="Reservas" radius={[0, 6, 6, 0]}>
                  {paquetesData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-muted-foreground flex-col gap-2">
              <Package className="w-8 h-8" />
              <p className="text-sm">Sin datos</p>
            </div>
          )}
        </div>

        {/* Bar hoteles */}
        <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-foreground">Hoteles más reservados</h3>
              <p className="text-xs text-muted-foreground">Por número de reservas</p>
            </div>
          </div>
          {hotelesData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={hotelesData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(123,30,58,0.08)" />
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={100} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="reservas" name="Reservas" radius={[0, 6, 6, 0]}>
                  {hotelesData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-muted-foreground flex-col gap-2">
              <Hotel className="w-8 h-8" />
              <p className="text-sm">Sin datos</p>
            </div>
          )}
        </div>

        {/* Bar métodos pago */}
        <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-foreground">Ingresos por método de pago</h3>
              <p className="text-xs text-muted-foreground">Monto total en COP</p>
            </div>
          </div>
          {metodosChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={metodosChart}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(123,30,58,0.08)" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `$${(v / 1000000).toFixed(1)}M`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="monto" name="Monto" radius={[6, 6, 0, 0]}>
                  {metodosChart.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-muted-foreground flex-col gap-2">
              <DollarSign className="w-8 h-8" />
              <p className="text-sm">Sin pagos registrados</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Actividad reciente — feed cronológico real (historial_reservas de
            TODAS las reservas, no solo un slice del array cargado), ver
            GET /historial-reservas/recientes en reserva_route.py */}
        <div className="bg-card rounded-2xl p-6 shadow-sm border border-border lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-foreground">Actividad reciente</h3>
            </div>
            <button
              onClick={() => setActiveModule("reservas")}
              className="text-xs text-[#7B1E3A] hover:text-[#A13B55] font-medium flex items-center gap-1 transition-colors"
            >
              Ver reservas <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          {actividad.length > 0 ? (
            <div className="space-y-1">
              {actividad.map(item => (
                <div key={item.id_historial} className="flex items-start gap-3 p-3 rounded-xl hover:bg-accent transition-colors">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">
                      <span className="font-medium">Reserva #{item.id_reserva}</span>
                      {item.estado_nuevo ? ` ${item.estado_nuevo}` : " actualizada"}
                      {item.nombre_empleado && item.nombre_empleado !== "Sistema" ? ` · ${item.nombre_empleado}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{tiempoRelativo(item.fecha_cambio)}</p>
                  </div>
                  {item.estado_nuevo && <StatusBadge status={item.estado_nuevo} className="flex-shrink-0" />}
                </div>
              ))}
            </div>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-muted-foreground flex-col gap-2">
              <Activity className="w-8 h-8" />
              <p className="text-sm">Todavía no hay actividad registrada</p>
            </div>
          )}
        </div>

        {/* Accesos rápidos + Alertas */}
        <div className="space-y-4">
          <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
            <h3 className="font-semibold text-foreground mb-4">Acciones rápidas</h3>
            <div className="space-y-2">
              {[
                { label: "Nueva Reserva",     mod: "crear-reserva", icon: PlusCircle, gradient: "from-[#7B1E3A] to-[#A13B55]" },
                { label: "Gestionar Hoteles", mod: "hoteles",        icon: Hotel,      gradient: "from-[#A13B55] to-[#7B1E3A]" },
                { label: "Ver Paquetes",      mod: "paquetes",       icon: Package,    gradient: "from-[#C9A227] to-[#e6b830]" },
                { label: "Ver Clientes",      mod: "clientes",       icon: Users,      gradient: "from-[#2E2E2E] to-[#555555]" },
              ].map(({ label, mod, icon: Icon, gradient }) => (
                <button
                  key={mod}
                  onClick={() => setActiveModule(mod)}
                  className={`w-full flex items-center gap-3 p-3 bg-gradient-to-r ${gradient} text-white rounded-xl text-sm font-medium hover:shadow-lg hover:scale-[1.02] transition-all`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {label}
                  <ArrowUpRight className="w-3 h-3 ml-auto opacity-70" />
                </button>
              ))}
            </div>
          </div>

          {/* Alertas */}
          <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
            <h3 className="font-semibold text-foreground mb-3">Alertas</h3>
            <div className="space-y-2">
              {pagosPendientes > 0 && (
                <div className="flex items-center gap-2 p-2.5 bg-[#fdf6e3] rounded-lg">
                  <Clock className="w-4 h-4 text-[#C9A227] flex-shrink-0" />
                  <p className="text-xs text-[#C9A227] font-medium">
                    {pagosPendientes} pago{pagosPendientes > 1 ? "s" : ""} pendiente{pagosPendientes > 1 ? "s" : ""}
                  </p>
                </div>
              )}
              {canceladas > 0 && (
                <div className="flex items-center gap-2 p-2.5 bg-[#f5e6e6] rounded-lg">
                  <XCircle className="w-4 h-4 text-[#c62828] flex-shrink-0" />
                  <p className="text-xs text-[#c62828] font-medium">
                    {canceladas} reserva{canceladas > 1 ? "s" : ""} cancelada{canceladas > 1 ? "s" : ""}
                  </p>
                </div>
              )}
              {pagosPendientes === 0 && canceladas === 0 && (
                <div className="flex items-center gap-2 p-2.5 bg-[#f1e4e8] rounded-lg">
                  <CheckCircle className="w-4 h-4 text-[#7B1E3A] flex-shrink-0" />
                  <p className="text-xs text-[#7B1E3A] font-medium">Todo en orden</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}