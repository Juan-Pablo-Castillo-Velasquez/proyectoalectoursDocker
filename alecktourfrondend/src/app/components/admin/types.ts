// Identificadores de cada pantalla del admin — compartido por
// Admindashboard.tsx (qué módulo renderizar) y AdminSidebar.tsx (qué ítem
// de navegación resaltar). Los que todavía no tienen módulo real construido
// (cancelaciones, empresas, pagos, notificaciones, roles, actividad,
// configuracion) muestran un EmptyState en vez de datos inventados — se
// van habilitando fase a fase del rediseño del panel.
export type Module =
  | "dashboard"
  | "reservas"
  | "crear-reserva"
  | "hoteles"
  | "paquetes"
  | "clientes"
  | "cancelaciones"
  | "empresas"
  | "pagos"
  | "usuarios"
  | "notificaciones"
  | "roles"
  | "actividad"
  | "configuracion";

export interface Reserva {
  id_reserva: number;
  id_cliente: number;
  id_paquete: number;
  id_empleado?: number;           // null = reserva hecha en web sin asesor
  fecha_inicio: string;
  fecha_fin: string;
  numero_personas: number;
  estado: string;
  // El backend (ReservaResponse) ya devuelve estos campos calculados desde
  // Reserva.hotel_nombre / Reserva.destino (ver reserva_model.py) — se
  // agregan aquí para el ranking "Hoteles más reservados" del Dashboard,
  // sin pedir ningún endpoint nuevo.
  hotel_nombre?: string | null;
  destino?: string | null;
  // precio_total ya existía en ReservaResponse; fecha_ultima_actualizacion
  // es nueva (ver Reserva.fecha_ultima_actualizacion en reserva_model.py) —
  // ambos para las columnas "Total" y "Última actualización" del módulo
  // de Reservas del admin.
  precio_total?: number;
  fecha_ultima_actualizacion?: string | null;
}

export type CanalOrigen = "web" | "empleado" | "telefono";

// Extiende Reserva con el campo canal_origen
// Recomendado: agregar esta columna a la tabla `reservas` en la DB
// ALTER TABLE reservas ADD COLUMN canal_origen VARCHAR(20) DEFAULT 'web'
//   CHECK (canal_origen IN ('web', 'empleado', 'telefono'));
export interface ReservaExtended extends Reserva {
  canal_origen?: CanalOrigen;
}

export interface HotelData {
  id_hotel: number;
  nombre_hotel: string;
  calificacion: number;
  ciudad: string;
  pais: string;
  correo_electronico: string;
  telefono: string;
  // GET /hoteles/ ya responde con HotelDetailResponse — estos campos ya
  // viajan en cada hotel de la lista, solo faltaba declararlos acá.
  // total_resenas/calificacion_promedio: reales, calculados en el backend
  // desde la tabla resenas (ver Hotel.total_resenas en hotel_model.py).
  total_resenas?: number;
  calificacion_promedio?: number | null;
  habitaciones?: { id_habitacion: number }[];
}

export interface Paquete {
  id_paquete: number;
  nombre_paquete: string;
  descripcion: string;
  duracion_dias: number;
  precio_base: number;
  activo: boolean;
}

export interface Cliente {
  id_cliente: number;
  nombre: string;
  apellido: string;
  cedula: string;
  correo: string;
  celular: string;
  direccion?: string;
  ciudad: string;
  pais: string;
  fecha_nacimiento?: string;
}

export interface Empleado {
  id_empleado: number;
  nombre: string;
  apellido: string;
  correo_electronico: string;
  celular?: string;
}

export interface Pago {
  id_pago: number;
  id_reserva: number;
  monto: number;
  estado: "pendiente" | "pagado" | "rechazado";
  referencia?: string;
  metodo_pago?: {
    id_metodo: number;
    nombre_metodo: string;
  };
}

export interface Usuario {
  id_usuario: number;
  username: string;
  correo_electronico: string;
  activo: boolean;
  verificado: boolean;
  nombre_completo: string | null;
  roles: string[];
}

export interface Rol {
  id_rol: number;
  nombre_rol: string;
}

// Colores de estado consistentes con la paleta de marca (mismo criterio que
// ModuleDashboard: dorado/granate/rosa para los estados normales, rojo
// reservado solo para "cancelada"). Usan opacidad en vez de mapas dark/light
// separados para que se vean bien en ambos temas sin duplicar clases.
export const ESTADO_COLOR: Record<string, string> = {
  pendiente: "bg-[#C9A227]/15 text-[#C9A227]",
  confirmada: "bg-primary/10 text-primary",
  cancelada: "bg-destructive/10 text-destructive",
  finalizada: "bg-[#A13B55]/15 text-[#A13B55]",
  // Estados de pagos (Pago.estado) y solicitudes de cancelación
  // (SolicitudCancelacion.estado) — mismos tokens de marca, para que
  // StatusBadge se vea consistente sin importar el dominio.
  procesando: "bg-[#C9A227]/15 text-[#C9A227]",
  pagado: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  rechazado: "bg-destructive/10 text-destructive",
  rechazada: "bg-destructive/10 text-destructive",
  aprobada: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  cancelado: "bg-destructive/10 text-destructive",
  // Estados de Usuario.activo
  activo: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  inactivo: "bg-muted text-muted-foreground",
};

export const inputCls =
  "w-full px-4 py-2.5 border border-border bg-input-background text-foreground rounded-xl focus:ring-2 focus:ring-primary/40 focus:border-primary focus:outline-none outline-none text-sm placeholder:text-muted-foreground/60";
export const labelCls = "block text-sm font-medium text-muted-foreground mb-1";

// Estilo de tarjeta compartido por todos los módulos de admin (misma
// convención visual que ModuleDashboard: tokens de marca, no grises sueltos).
export const cardCls = "bg-card rounded-2xl p-6 shadow-sm border border-border";
export const primaryBtnCls =
  "w-full py-2.5 bg-gradient-to-r from-primary to-[#A13B55] text-primary-foreground font-semibold rounded-xl hover:shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-50 text-sm";