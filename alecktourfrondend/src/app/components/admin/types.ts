export interface Reserva {
  id_reserva: number;
  id_cliente: number;
  id_paquete: number;
  id_empleado?: number;           // null = reserva hecha en web sin asesor
  fecha_inicio: string;
  fecha_fin: string;
  numero_personas: number;
  estado: string;
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

export const ESTADO_COLOR: Record<string, string> = {
  pendiente: "bg-amber-100 text-amber-700",
  confirmada: "bg-green-100 text-green-700",
  cancelada:  "bg-red-100 text-red-700",
  finalizada: "bg-blue-100 text-blue-700",
};

export const inputCls =
  "w-full px-4 py-2.5 border border-border bg-input-background text-foreground rounded-xl focus:ring-2 focus:ring-primary/40 focus:border-primary focus:outline-none outline-none text-sm placeholder:text-muted-foreground/60";
export const labelCls = "block text-sm font-medium text-muted-foreground mb-1";

// Estilo de tarjeta compartido por todos los módulos de admin (misma
// convención visual que ModuleDashboard: tokens de marca, no grises sueltos).
export const cardCls = "bg-card rounded-2xl p-6 shadow-sm border border-border";
export const primaryBtnCls =
  "w-full py-2.5 bg-gradient-to-r from-primary to-[#A13B55] text-primary-foreground font-semibold rounded-xl hover:shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-50 text-sm";