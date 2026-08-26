export interface ReservaResponse {
  id_reserva: number;
  id_cliente: number;
  id_empleado: number;
  id_paquete: number;
  fecha_reserva: string;
  fecha_inicio: string;
  fecha_fin: string;
  numero_personas: number;
  estado: 'pendiente' | 'confirmada' | 'cancelada' | 'finalizada';
  precio_total?: number;
  // Nombre del paquete y ciudad/país del hotel — resueltos por el backend
  // (Reserva.nombre_paquete / Reserva.destino) para no mostrar solo el
  // id_paquete crudo en el historial de reservas.
  nombre_paquete?: string | null;
  destino?: string | null;
  // Nombre del hotel — respaldo cuando la reserva no tiene paquete (reserva
  // directa de habitación); ver Reserva.hotel_nombre en el backend.
  hotel_nombre?: string | null;
}

// NUEVO: representa una habitación específica dentro de una reserva
export interface HabitacionReservaCreate {
  id_habitacion: number;
  fecha_checkin: string;
  fecha_checkout: string;
}

export interface ReservaCreate {
  id_cliente: number;
  id_empleado?: number;
  id_paquete?: number;
  fecha_inicio: string;
  fecha_fin: string;
  numero_personas: number;
  estado?: string;
  // NUEVO: si se está reservando una habitación de hotel, va aquí.
  // El precio NO se manda desde el frontend: el backend lo calcula con el precio real de la BD.
  habitaciones?: HabitacionReservaCreate[];
}

export interface ReservaUpdate extends Partial<ReservaCreate> { }