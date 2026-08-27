import { useMemo, useState } from "react";
import { Bed, Check, ChevronLeft, Hotel, Search, Users } from "lucide-react";
import { Cliente, HotelData, Paquete, inputCls, labelCls, resolveFotoUrl } from "./types";
import AdminModal from "./ui/AdminModal";
import Avatar from "./ui/Avatar";

interface Props {
  clientes: Cliente[];
  paquetes: Paquete[];
  hoteles: HotelData[];
  onSubmit: (data: any) => Promise<void>;
  loading: boolean;
}

interface HabitacionElegida {
  id_habitacion: number;
  numero_habitacion: string;
  tipo: string;
  precio_noche: number;
  nombre_hotel: string;
}

const FORM_INICIAL = {
  id_cliente: "", id_paquete: "", fecha_inicio: "",
  fecha_fin: "", numero_personas: "1", estado: "pendiente",
};

function nochesEntre(inicio: string, fin: string): number {
  if (!inicio || !fin) return 0;
  const ms = new Date(fin).getTime() - new Date(inicio).getTime();
  const dias = Math.round(ms / (1000 * 60 * 60 * 24));
  return dias > 0 ? dias : 0;
}

// Módulo "Crear Reserva" del admin. Antes solo permitía elegir un Paquete
// turístico de un <select> plano y un cliente por id/cédula en otro — no
// había forma de reservar directamente una habitación de un hotel (algo que
// el backend ya soporta de sobra: POST /reservas acepta `habitaciones`
// junto con id_paquete opcional, usado hoy por el checkout público), ni de
// ver más que el nombre del cliente al elegirlo. Ahora:
// - El cliente se elige desde un buscador en pop-up con foto real (o
//   iniciales si no tiene) para identificarlo de un vistazo, no solo por id.
// - Se puede armar la reserva sobre un Paquete turístico (como antes) O
//   directo sobre un Hotel + habitación(es) real(es), igual que en el
//   flujo de reserva del sitio público — sin inventar ningún endpoint
//   nuevo, el backend ya validaba y soportaba esto.
export default function ModuleCrearReserva({ clientes, paquetes, hoteles, onSubmit, loading }: Props) {
  const [modo, setModo] = useState<"paquete" | "hotel">("paquete");
  const [form, setForm] = useState({ ...FORM_INICIAL });
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [habitaciones, setHabitaciones] = useState<HabitacionElegida[]>([]);

  // Pop-up de cliente
  const [clientePickerOpen, setClientePickerOpen] = useState(false);
  const [clienteQuery, setClienteQuery] = useState("");

  // Pop-up de hotel/habitación
  const [hotelPickerOpen, setHotelPickerOpen] = useState(false);
  const [hotelQuery, setHotelQuery] = useState("");
  const [hotelExpandido, setHotelExpandido] = useState<HotelData | null>(null);

  const clienteSeleccionado = clientes.find((c) => c.id_cliente === parseInt(form.id_cliente));
  const paqueteSeleccionado = paquetes.find((p) => p.id_paquete === parseInt(form.id_paquete));

  const clientesFiltrados = useMemo(() => {
    const q = clienteQuery.trim().toLowerCase();
    if (!q) return clientes;
    return clientes.filter((c) =>
      `${c.nombre} ${c.apellido} ${c.cedula} ${c.correo ?? ""} ${c.ciudad ?? ""}`.toLowerCase().includes(q)
    );
  }, [clientes, clienteQuery]);

  const hotelesFiltrados = useMemo(() => {
    const q = hotelQuery.trim().toLowerCase();
    if (!q) return hoteles;
    return hoteles.filter((h) =>
      `${h.nombre_hotel} ${h.ciudad ?? ""} ${h.pais ?? ""}`.toLowerCase().includes(q)
    );
  }, [hoteles, hotelQuery]);

  const noches = nochesEntre(form.fecha_inicio, form.fecha_fin);
  const total = modo === "paquete"
    ? (paqueteSeleccionado ? paqueteSeleccionado.precio_base * parseInt(form.numero_personas || "1") : 0)
    : habitaciones.reduce((acc, h) => acc + h.precio_noche, 0) * (noches || 1);

  function toggleHabitacion(hotel: HotelData, hab: NonNullable<HotelData["habitaciones"]>[number]) {
    if (hab.estado !== "disponible") return;
    setHabitaciones((prev) => {
      const yaEsta = prev.find((h) => h.id_habitacion === hab.id_habitacion);
      if (yaEsta) return prev.filter((h) => h.id_habitacion !== hab.id_habitacion);
      return [
        ...prev,
        {
          id_habitacion: hab.id_habitacion,
          numero_habitacion: hab.numero_habitacion,
          tipo: hab.tipo_habitacion?.nombre_tipo ?? "Habitación",
          precio_noche: hab.precio_noche,
          nombre_hotel: hotel.nombre_hotel,
        },
      ];
    });
  }

  function cambiarModo(nuevo: "paquete" | "hotel") {
    setModo(nuevo);
    setMsg(null);
    // Cambiar de modo limpia lo del modo anterior para no mandar al backend
    // una mezcla de paquete + habitaciones sueltas que no tiene sentido.
    if (nuevo === "paquete") setHabitaciones([]);
    else setForm((f) => ({ ...f, id_paquete: "" }));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);

    if (!form.id_cliente) {
      setMsg({ type: "err", text: "Selecciona un cliente" });
      return;
    }
    if (modo === "hotel" && habitaciones.length === 0) {
      setMsg({ type: "err", text: "Selecciona al menos una habitación" });
      return;
    }

    const payload: any = {
      id_cliente: parseInt(form.id_cliente),
      fecha_inicio: form.fecha_inicio,
      fecha_fin: form.fecha_fin,
      numero_personas: parseInt(form.numero_personas),
      estado: form.estado,
    };
    if (modo === "paquete") {
      payload.id_paquete = parseInt(form.id_paquete);
    } else {
      // El backend calcula el precio real desde la BD (nunca confía en lo
      // que mande el frontend) y valida disponibilidad real de fechas —
      // ver ReservaRepository.create / _verificar_disponibilidad.
      payload.habitaciones = habitaciones.map((h) => ({
        id_habitacion: h.id_habitacion,
        fecha_checkin: form.fecha_inicio,
        fecha_checkout: form.fecha_fin,
      }));
    }

    try {
      await onSubmit(payload);
      setMsg({ type: "ok", text: "Reserva creada exitosamente" });
      setForm({ ...FORM_INICIAL });
      setHabitaciones([]);
    } catch (err: any) {
      setMsg({ type: "err", text: err.message || "Error al crear reserva" });
    }
  };

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Crear Reserva</h2>
        <p className="text-muted-foreground text-sm">Registra una nueva reserva para un cliente</p>
      </div>

      <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
        <form onSubmit={handleSubmit} className="space-y-4">
          {msg && (
            <div className={`p-3 rounded-xl text-sm font-medium ${msg.type === "ok" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
              {msg.text}
            </div>
          )}

          {/* Cliente — buscador con foto real en vez de un <select> por id/cédula */}
          <div>
            <label className={labelCls}>Cliente</label>
            {clienteSeleccionado ? (
              <div className="flex items-center gap-3 p-2.5 border border-border rounded-xl bg-muted/30">
                <Avatar
                  nombre={clienteSeleccionado.nombre}
                  apellido={clienteSeleccionado.apellido}
                  fotoUrl={resolveFotoUrl(clienteSeleccionado.foto_perfil)}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {clienteSeleccionado.nombre} {clienteSeleccionado.apellido}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {clienteSeleccionado.cedula} · {clienteSeleccionado.correo}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setClientePickerOpen(true)}
                  className="text-xs font-semibold text-primary hover:underline flex-shrink-0"
                >
                  Cambiar
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setClientePickerOpen(true)}
                className={`${inputCls} text-left text-muted-foreground flex items-center gap-2`}
              >
                <Search className="w-4 h-4 flex-shrink-0" /> Buscar cliente por nombre, cédula o correo...
              </button>
            )}
          </div>

          {/* Tipo de reserva */}
          <div>
            <label className={labelCls}>Tipo de reserva</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => cambiarModo("paquete")}
                className={`py-2.5 rounded-xl text-sm font-medium border transition-all ${
                  modo === "paquete" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted/50"
                }`}
              >
                Paquete turístico
              </button>
              <button
                type="button"
                onClick={() => cambiarModo("hotel")}
                className={`py-2.5 rounded-xl text-sm font-medium border transition-all ${
                  modo === "hotel" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted/50"
                }`}
              >
                Hotel y habitación
              </button>
            </div>
          </div>

          {modo === "paquete" ? (
            <div>
              <label className={labelCls}>Paquete</label>
              <select value={form.id_paquete}
                onChange={(e) => setForm({ ...form, id_paquete: e.target.value })}
                className={inputCls} required>
                <option value="">Seleccionar paquete...</option>
                {paquetes.map((p) => (
                  <option key={p.id_paquete} value={p.id_paquete}>
                    {p.nombre_paquete} — ${p.precio_base?.toLocaleString()} ({p.duracion_dias}d)
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className={labelCls}>Hotel y habitación</label>
              {habitaciones.length > 0 ? (
                <div className="space-y-2">
                  {habitaciones.map((h) => (
                    <div key={h.id_habitacion} className="flex items-center gap-3 p-2.5 border border-border rounded-xl bg-muted/30">
                      <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                        <Bed className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {h.nombre_hotel} — Hab. {h.numero_habitacion}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {h.tipo} · ${h.precio_noche.toLocaleString()}/noche
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setHabitaciones((prev) => prev.filter((x) => x.id_habitacion !== h.id_habitacion))}
                        className="text-xs font-semibold text-destructive hover:underline flex-shrink-0"
                      >
                        Quitar
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setHotelPickerOpen(true)}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    + Agregar otra habitación
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setHotelPickerOpen(true)}
                  className={`${inputCls} text-left text-muted-foreground flex items-center gap-2`}
                >
                  <Hotel className="w-4 h-4 flex-shrink-0" /> Buscar hotel y elegir habitación...
                </button>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Fecha inicio</label>
              <input type="date" value={form.fecha_inicio}
                onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })}
                className={inputCls} required />
            </div>
            <div>
              <label className={labelCls}>Fecha fin</label>
              <input type="date" value={form.fecha_fin}
                onChange={(e) => setForm({ ...form, fecha_fin: e.target.value })}
                className={inputCls} required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Número de personas</label>
              <input type="number" min="1" value={form.numero_personas}
                onChange={(e) => setForm({ ...form, numero_personas: e.target.value })}
                className={inputCls} required />
            </div>
            <div>
              <label className={labelCls}>Estado</label>
              <select value={form.estado}
                onChange={(e) => setForm({ ...form, estado: e.target.value })}
                className={inputCls}>
                {["pendiente", "confirmada", "cancelada", "finalizada"].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {((modo === "paquete" && paqueteSeleccionado) || (modo === "hotel" && habitaciones.length > 0)) && (
            <div className="bg-accent rounded-xl p-4 text-sm space-y-1">
              <p className="font-semibold text-primary">Resumen de reserva</p>
              {clienteSeleccionado && <p className="text-accent-foreground">Cliente: {clienteSeleccionado.nombre} {clienteSeleccionado.apellido}</p>}
              {modo === "paquete" ? (
                <>
                  <p className="text-accent-foreground">Paquete: {paqueteSeleccionado!.nombre_paquete}</p>
                  <p className="text-accent-foreground">Duración: {paqueteSeleccionado!.duracion_dias} días</p>
                </>
              ) : (
                <>
                  <p className="text-accent-foreground">
                    Habitaciones: {habitaciones.map((h) => `${h.nombre_hotel} (${h.numero_habitacion})`).join(", ")}
                  </p>
                  <p className="text-accent-foreground">Noches: {noches || "—"}</p>
                </>
              )}
              <p className="font-bold text-primary text-base">Total estimado: ${total.toLocaleString()}</p>
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-[#2563EB] to-[#06B6D4] text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50">
            {loading ? "Creando..." : "Crear Reserva"}
          </button>
        </form>
      </div>

      {/* Pop-up: seleccionar cliente */}
      <AdminModal
        open={clientePickerOpen}
        onOpenChange={(o) => { setClientePickerOpen(o); if (!o) setClienteQuery(""); }}
        title="Seleccionar cliente"
        description="Busca por nombre, cédula, correo o ciudad."
        maxWidth="sm:max-w-lg"
      >
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              autoFocus
              value={clienteQuery}
              onChange={(e) => setClienteQuery(e.target.value)}
              placeholder="Ej: María Gómez, 1020304050..."
              className={`${inputCls} pl-10`}
            />
          </div>
          <div className="max-h-96 overflow-y-auto space-y-1.5">
            {clientesFiltrados.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">No se encontraron clientes.</p>
            )}
            {clientesFiltrados.map((c) => (
              <button
                key={c.id_cliente}
                type="button"
                onClick={() => { setForm((f) => ({ ...f, id_cliente: String(c.id_cliente) })); setClientePickerOpen(false); setClienteQuery(""); }}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl border border-transparent hover:border-border hover:bg-muted/50 transition-all text-left"
              >
                <Avatar nombre={c.nombre} apellido={c.apellido} fotoUrl={resolveFotoUrl(c.foto_perfil)} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground truncate">{c.nombre} {c.apellido}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {c.cedula} · {c.correo} {c.ciudad ? `· ${c.ciudad}` : ""}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </AdminModal>

      {/* Pop-up: seleccionar hotel y habitación */}
      <AdminModal
        open={hotelPickerOpen}
        onOpenChange={(o) => { setHotelPickerOpen(o); if (!o) { setHotelExpandido(null); setHotelQuery(""); } }}
        title={hotelExpandido ? `Habitaciones — ${hotelExpandido.nombre_hotel}` : "Seleccionar hotel"}
        description={hotelExpandido ? "Toca una habitación disponible para agregarla." : "Busca por nombre, ciudad o país."}
        maxWidth="sm:max-w-lg"
      >
        {!hotelExpandido ? (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                autoFocus
                value={hotelQuery}
                onChange={(e) => setHotelQuery(e.target.value)}
                placeholder="Ej: Cartagena, Hotel Bahía..."
                className={`${inputCls} pl-10`}
              />
            </div>
            <div className="max-h-96 overflow-y-auto space-y-1.5">
              {hotelesFiltrados.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">No se encontraron hoteles.</p>
              )}
              {hotelesFiltrados.map((h) => {
                const disponibles = (h.habitaciones ?? []).filter((hab) => hab.estado === "disponible").length;
                return (
                  <button
                    key={h.id_hotel}
                    type="button"
                    onClick={() => setHotelExpandido(h)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl border border-transparent hover:border-border hover:bg-muted/50 transition-all text-left"
                  >
                    <div className="w-9 h-9 rounded-full bg-[#C9A227]/15 text-[#C9A227] flex items-center justify-center flex-shrink-0">
                      <Hotel className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground truncate">{h.nombre_hotel}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {[h.ciudad, h.pais].filter(Boolean).join(", ")}
                        {h.calificacion_promedio != null ? ` · ${h.calificacion_promedio}★ (${h.total_resenas ?? 0})` : ""}
                      </p>
                    </div>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${disponibles > 0 ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"}`}>
                      {disponibles} libres
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setHotelExpandido(null)}
              className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Volver a hoteles
            </button>
            <div className="max-h-96 overflow-y-auto space-y-1.5">
              {(hotelExpandido.habitaciones ?? []).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">Este hotel no tiene habitaciones registradas.</p>
              )}
              {(hotelExpandido.habitaciones ?? []).map((hab) => {
                const elegida = habitaciones.some((h) => h.id_habitacion === hab.id_habitacion);
                const disponible = hab.estado === "disponible";
                return (
                  <button
                    key={hab.id_habitacion}
                    type="button"
                    disabled={!disponible}
                    onClick={() => toggleHabitacion(hotelExpandido, hab)}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl border transition-all text-left ${
                      elegida ? "border-primary bg-primary/5" : "border-border"
                    } ${disponible ? "hover:bg-muted/50 cursor-pointer" : "opacity-50 cursor-not-allowed"}`}
                  >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${elegida ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                      {elegida ? <Check className="w-4 h-4" /> : <Bed className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground truncate">
                        Hab. {hab.numero_habitacion} — {hab.tipo_habitacion?.nombre_tipo ?? "Habitación"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                        <Users className="w-3 h-3" /> {hab.tipo_habitacion?.capacidad_personas ?? "—"} personas · ${hab.precio_noche.toLocaleString()}/noche
                      </p>
                    </div>
                    {!disponible && (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground flex-shrink-0 capitalize">
                        {hab.estado}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            {habitaciones.length > 0 && (
              <button
                type="button"
                onClick={() => setHotelPickerOpen(false)}
                className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-95 transition-all"
              >
                Listo ({habitaciones.length} habitación{habitaciones.length > 1 ? "es" : ""})
              </button>
            )}
          </div>
        )}
      </AdminModal>
    </div>
  );
}
