import {
  Calendar,
  ChevronRight,
  Heart,
  LogOut,
  Mail,
  MapPin,
  Phone,
  Plane,
  Settings,
  SlidersHorizontal,
  User,
} from "lucide-react";
import { resolveFotoUrl } from "../admin/types";
const tabs = [
  { id: "reservas", label: "Mis Reservas", icon: Calendar },
  { id: "favoritos", label: "Favoritos", icon: Heart },
  { id: "preferencias", label: "Preferencias", icon: SlidersHorizontal },
  { id: "cuenta", label: "Mi Cuenta", icon: Settings },
];

interface Props {
  usuario: any;
  clienteData: any;
  reservas: any[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
}

export default function ProfileSidebar({
  usuario,
  clienteData,
  reservas,
  activeTab,
  setActiveTab,
  onLogout,
}: Props) {
  const totalViajes = reservas.filter((r) => r.estado === "finalizada").length;
  const proximaReserva = reservas
    .filter(
      (r) => r.estado !== "cancelada" && new Date(r.fecha_inicio) >= new Date(),
    )
    .sort(
      (a, b) =>
        new Date(a.fecha_inicio).getTime() - new Date(b.fecha_inicio).getTime(),
    )[0];

  return (
    <div className="bg-card text-card-foreground rounded-xl shadow-md border border-border overflow-hidden sticky top-24 transition-colors duration-200">
      {/* ── Banner Sutil Superior ── */}
      <div className="h-16 bg-primary/10 border-b border-border relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5" />
      </div>

      <div className="px-5 pb-5">
        {/* Avatar Integrado */}
        <div className="-mt-10 mb-3 flex justify-center">
          <div className="w-20 h-20 bg-card rounded-full flex items-center justify-center ring-4 ring-background shadow-md border border-border overflow-hidden">
            {usuario?.foto_perfil ? (
              <img
                src={resolveFotoUrl(usuario.foto_perfil)}
                alt="Foto de perfil"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full m-1 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                <User className="w-9 h-9" />
              </div>
            )}
          </div>
        </div>

        {/* Nombre y Tipo de Viajero */}
        <div className="text-center mb-5">
          <h2 className="text-base font-bold text-foreground tracking-tight leading-tight">
            {clienteData
              ? `${clienteData.nombre} ${clienteData.apellido}`
              : usuario?.username}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            @{usuario?.username || "viajero"}
          </p>
        </div>

        {/* Contadores Semánticos */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            {
              value: reservas.length,
              label: "Reservas",
              color: "text-foreground",
            },
            { value: totalViajes, label: "Viajes", color: "text-primary" },
            {
              value: reservas.filter((r) => r.estado === "pendiente").length,
              label: "Pendientes",
              color: "text-amber-600 dark:text-amber-400",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="stat-chip rounded-lg py-2 text-center"
            >
              <p className={`text-lg font-bold tracking-tight ${s.color}`}>
                {s.value}
              </p>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* Información de Contacto */}
        {clienteData && (
          <div className="space-y-2 mb-4 py-3 border-t border-b border-border/60">
            {clienteData.correo && (
              <div className="flex items-center gap-2.5 text-muted-foreground text-xs">
                <Mail className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="truncate">{clienteData.correo}</span>
              </div>
            )}
            {clienteData.celular && (
              <div className="flex items-center gap-2.5 text-muted-foreground text-xs">
                <Phone className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>{clienteData.celular}</span>
              </div>
            )}
            {clienteData.ciudad && (
              <div className="flex items-center gap-2.5 text-muted-foreground text-xs">
                <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="truncate">
                  {clienteData.ciudad}, {clienteData.pais}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Próximo Viaje Destacado en Oscuro Distintivo */}
        {proximaReserva && (
          <div className="bg-neutral-900 dark:bg-muted text-neutral-100 dark:text-foreground rounded-xl p-3.5 mb-4 border border-neutral-800 dark:border-border shadow-sm">
            <div className="flex items-center gap-1.5 mb-1.5 text-primary dark:text-primary">
              <Plane className="w-3.5 h-3.5 transform rotate-45" />
              <span className="text-[10px] font-bold uppercase tracking-widest">
                Próximo viaje
              </span>
            </div>
            <p className="text-sm font-bold tracking-tight text-white dark:text-foreground">
              Paquete #{proximaReserva.id_paquete}
            </p>
            <p className="text-xs text-neutral-400 dark:text-muted-foreground mt-0.5 font-medium">
              {new Date(proximaReserva.fecha_inicio).toLocaleDateString(
                "es-CO",
                { day: "numeric", month: "short" },
              )}
              {" → "}
              {new Date(proximaReserva.fecha_fin).toLocaleDateString("es-CO", {
                day: "numeric",
                month: "short",
              })}
            </p>
          </div>
        )}

        {/* Menú de Pestañas con Navegación Corporativa */}
        <nav className="space-y-1 mb-4">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 min-h-[40px] rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <tab.icon className="w-4 h-4 shrink-0" />
                <span className="flex-1 text-left">{tab.label}</span>
                <ChevronRight
                  className={`w-4 h-4 transition-transform duration-200 ${isActive ? "rotate-90 text-primary-foreground" : "text-muted-foreground/50"}`}
                />
              </button>
            );
          })}
        </nav>

        {/* Botón de Salida Destructivo */}
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2 min-h-[40px] rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 border border-transparent hover:border-destructive/20 transition-all duration-200 mt-2 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
