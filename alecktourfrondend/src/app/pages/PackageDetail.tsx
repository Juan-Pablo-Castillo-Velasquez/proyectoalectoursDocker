import {
  Bus,
  CalendarDays,
  CheckCircle2,
  Clock,
  Hotel as HotelIcon,
  MapPin,
  Plane,
  Sparkles,
  Star,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import HotelCard from "../components/HotelCard";
import Navbar from "../components/Navbar";
import { resolveFotoUrl } from "../components/admin/types";
import { HotelDetailResponse, hotelService } from "../services/hotel.service";
import {
  PaqueteDetalleResponse,
  PaqueteHotelDetalle,
  PaqueteServicioDetalle,
  paqueteService,
} from "../services/paquete.service";

// Fotos reales por ciudad, solo como respaldo cuando ningún hotel del
// paquete tiene foto propia todavía (ver getHotelImage) -- nunca inventamos
// datos, solo elegimos una foto ilustrativa del destino real del paquete.
// Mismas fotos ya verificadas visualmente una por una que usan
// HotelCard.tsx/HotelDetail.tsx (antes esta lista tenía varias equivocadas,
// heredadas de la misma tanda sin verificar que causó el bug de fotos de
// hoteles: ver alembic/versions/7972baf77f44_corregir_fotos_hoteles_demo.py).
const CITY_IMAGES: Record<string, string> = {
  cartagena: "https://images.unsplash.com/photo-1658591049748-4937f0a9051a?w=1400&q=80",
  "santa marta": "https://images.unsplash.com/photo-1788184851263-f832bf6c76f3?w=1400&q=80",
  medellín: "https://images.unsplash.com/photo-1570793005386-840846445fed?w=1400&q=80",
  medellin: "https://images.unsplash.com/photo-1570793005386-840846445fed?w=1400&q=80",
  bogotá: "https://images.unsplash.com/photo-1605723517503-3cadb5818a0c?w=1400&q=80",
  bogota: "https://images.unsplash.com/photo-1605723517503-3cadb5818a0c?w=1400&q=80",
  cali: "https://images.unsplash.com/photo-1758165532022-a68f291317ba?w=1400&q=80",
  salento: "https://images.unsplash.com/photo-1749063240369-391a2e82dc04?w=1400&q=80",
  "villa de leyva": "https://images.unsplash.com/photo-1788203816802-5fa9a5086f27?w=1400&q=80",
  barranquilla: "https://images.unsplash.com/photo-1564399331650-bbfe2aac0a04?w=1400&q=80",
  "san andrés": "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1400&q=80",
  "san andres": "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1400&q=80",
};
const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1400&q=80";

function getImage(ciudad?: string | null) {
  if (!ciudad) return DEFAULT_IMAGE;
  return CITY_IMAGES[ciudad.toLowerCase().trim()] ?? DEFAULT_IMAGE;
}

// Antes esta página siempre mostraba una foto genérica por ciudad, incluso
// para paquetes cuyo hotel real ya tiene una foto propia y correcta en la
// base de datos (Hotel.imagen_url) -- la ruta /paquetes/{id}/detalle ya
// carga el hotel completo, así que ahora se usa esa foto real primero.
function getHotelImage(hotel?: PaqueteHotelDetalle): string {
  return resolveFotoUrl(hotel?.imagen_url) ?? getImage(hotel?.ciudad);
}

// Agrupa los servicios reales del paquete por día (PaqueteServicio.dia_actividad)
// para armar un itinerario día a día -- antes se mostraban todos en una sola
// lista plana sin ningún orden temporal, indistinguible de un simple listado
// de "servicios de hotel".
function agruparPorDia(servicios: PaqueteServicioDetalle[]) {
  const grupos = new Map<number | null, PaqueteServicioDetalle[]>();
  for (const s of servicios) {
    const key = s.dia_actividad ?? null;
    if (!grupos.has(key)) grupos.set(key, []);
    grupos.get(key)!.push(s);
  }
  return [...grupos.entries()].sort(([a], [b]) => {
    if (a == null) return 1;
    if (b == null) return -1;
    return a - b;
  });
}

// El usuario reportó que un paquete con solo un hotel y una actividad se
// sentía vacío/incompleto -- varios paquetes demo en efecto no tenían
// ningún tramo de transporte real en la base de datos (ver migración
// 4f7efe4c291c_agregar_transporte_a_paquetes.py, que agrega uno con
// categoría "Transporte" a cada uno de esos paquetes). Estos separan esos
// servicios del resto de la lista para darles su propia sección visible,
// en vez de perderse mezclados entre tours y entradas.
function esTransporte(servicio: PaqueteServicioDetalle): boolean {
  return servicio.categoria?.toLowerCase() === "transporte";
}

// Ícono según el tipo real de transporte (a partir del nombre del
// servicio, ej. "Vuelo Bogotá - San Andrés") -- nunca asumimos un solo
// ícono para todos los tramos, ya que un paquete puede combinar vuelos con
// traslados terrestres.
function getTransporteIcon(nombreServicio: string) {
  const esAereo = /vuelo|aére|aere|avioneta/i.test(nombreServicio);
  return esAereo ? Plane : Bus;
}

export default function PackageDetail() {
  const { id } = useParams();
  const [pkg, setPkg] = useState<PaqueteDetalleResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  // Ficha completa de cada hotel del paquete (con habitaciones, reseñas y
  // características reales) -- PaqueteHotelDetalle solo trae lo básico, y
  // la sección "Hospedaje" reutiliza el mismo HotelCard.tsx de los
  // resultados de búsqueda para que un hotel se vea IGUAL ahí que acá
  // (pedido explícito: "quiero que reutilice componentes"). Se guarda por
  // id_hotel porque el fetch es independiente del orden en que resuelvan.
  const [hotelesDetalle, setHotelesDetalle] = useState<Record<number, HotelDetailResponse>>({});

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setNotFound(false);
    setHotelesDetalle({});
    paqueteService
      .getDetalle(parseInt(id))
      .then(setPkg)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!pkg) return;
    pkg.hoteles.forEach((hotel) => {
      hotelService
        .getById(hotel.id_hotel)
        .then((detalle) =>
          setHotelesDetalle((prev) => ({ ...prev, [hotel.id_hotel]: detalle }))
        )
        .catch(() => {
          // Si un hotel puntual falla, HotelCard sigue mostrando su
          // skeleton de carga en vez de romper el resto de la página.
        });
    });
  }, [pkg]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background transition-colors duration-200">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse">
          <div className="h-96 md:h-[500px] bg-muted rounded-3xl mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="h-40 bg-card border border-border rounded-2xl" />
              <div className="h-56 bg-card border border-border rounded-2xl" />
            </div>
            <div className="h-72 bg-card border border-border rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !pkg) {
    return (
      <div className="min-h-screen bg-background transition-colors duration-200">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <div className="bg-muted w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <MapPin className="w-8 h-8 text-muted-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-4">
            Paquete no encontrado
          </h1>
          <Link to="/packages" className="text-primary hover:underline font-medium">
            ← Volver a explorar paquetes
          </Link>
        </div>
      </div>
    );
  }

  const destinoPrincipal = pkg.destinos[0] ?? pkg.hoteles[0]?.ciudad ?? pkg.nombre_paquete;
  const heroHotel = pkg.hoteles[0];
  const heroImage = heroHotel ? getHotelImage(heroHotel) : getImage(pkg.destinos[0]);
  const heroPais = heroHotel?.pais ?? "Colombia";
  const transportes = pkg.servicios.filter(esTransporte);
  const actividades = pkg.servicios.filter((s) => !esTransporte(s));
  const itinerario = agruparPorDia(actividades);

  return (
    <div className="min-h-screen bg-background transition-colors duration-200">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header Image — ahora la foto real del hotel incluido en el
            paquete (Hotel.imagen_url) en vez de una foto genérica por
            ciudad, la misma que ya se corrigió en el detalle del hotel. */}
        <div className="relative h-96 md:h-[500px] rounded-3xl overflow-hidden mb-8">
          <img
            src={heroImage}
            alt={destinoPrincipal ?? pkg.nombre_paquete}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = DEFAULT_IMAGE;
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-5 h-5" />
              <span className="text-lg">{heroPais}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{pkg.nombre_paquete}</h1>
            <div className="flex flex-wrap items-center gap-6">
              {pkg.hoteles[0]?.calificacion && (
                <div className="flex items-center gap-2">
                  {Array.from({ length: pkg.hoteles[0].calificacion }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
              )}
              {pkg.duracion_dias && (
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  <span>{pkg.duracion_dias} {pkg.duracion_dias === 1 ? "día" : "días"}</span>
                </div>
              )}
              {pkg.destinos.length > 0 && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  <span>{pkg.destinos.join(" · ")}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            {pkg.descripcion && (
              <section className="bg-card border border-border rounded-2xl shadow-sm p-8">
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  Descripción del viaje
                </h2>
                <p className="text-muted-foreground leading-relaxed text-lg">
                  {pkg.descripcion}
                </p>
              </section>
            )}

            {/* Itinerario — antes había un checklist plano de "¿Qué
                incluye?" sin ningún orden; ahora se agrupa por día real
                (PaqueteServicio.dia_actividad) para que se sienta como un
                itinerario de viaje, no como el listado de amenidades de un
                hotel. */}
            <section className="bg-card border border-border rounded-2xl shadow-sm p-8">
              <div className="flex items-center gap-3 mb-6">
                <CalendarDays className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-bold text-foreground">Itinerario del viaje</h2>
              </div>
              {itinerario.length > 0 ? (
                <div className="space-y-6">
                  {itinerario.map(([dia, items], idx) => (
                    <div
                      key={dia ?? "sin-dia"}
                      className={`relative pl-7 ${idx < itinerario.length - 1 ? "pb-6 border-l-2 border-primary/15" : ""}`}
                    >
                      <span className="absolute -left-[7px] top-0 w-3.5 h-3.5 rounded-full bg-primary ring-4 ring-primary/10" />
                      <h3 className="text-sm font-bold uppercase tracking-wide text-primary mb-3">
                        {dia != null ? `Día ${dia}` : "Otros servicios incluidos"}
                      </h3>
                      <div className="space-y-3">
                        {items.map((servicio) => (
                          <div key={servicio.id_servicio} className="flex items-start gap-3">
                            <CheckCircle2
                              className={`w-5 h-5 flex-shrink-0 mt-0.5 ${servicio.incluido ? "text-primary" : "text-muted-foreground/50"}`}
                            />
                            <div>
                              <span className="text-foreground font-medium">
                                {servicio.nombre_servicio}
                              </span>
                              {!servicio.incluido && (
                                <span className="ml-2 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                                  Opcional
                                </span>
                              )}
                              {servicio.categoria && (
                                <span className="block text-xs text-muted-foreground">
                                  {servicio.categoria}
                                </span>
                              )}
                              {servicio.descripcion && (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {servicio.descripcion}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  Aún no hay servicios detallados para este paquete — contáctanos para más información.
                </p>
              )}
            </section>

            {/* Transporte incluido — antes los tramos de transporte (si
                existían) se perdían mezclados en el checklist plano de
                servicios, indistinguibles de un tour o una entrada. Ahora
                tienen su propia sección, igual de visible que Hospedaje. */}
            {transportes.length > 0 && (
              <section className="bg-card border border-border rounded-2xl shadow-sm p-8">
                <div className="flex items-center gap-3 mb-6">
                  <Bus className="w-6 h-6 text-primary" />
                  <h2 className="text-2xl font-bold text-foreground">Transporte incluido</h2>
                </div>
                <div className="space-y-4">
                  {transportes.map((transporte) => {
                    const IconoTransporte = getTransporteIcon(transporte.nombre_servicio);
                    return (
                      <div
                        key={transporte.id_servicio}
                        className="flex items-start gap-4 p-4 rounded-xl bg-muted/40"
                      >
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <IconoTransporte className="w-5 h-5 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-foreground">
                              {transporte.nombre_servicio}
                            </span>
                            {transporte.dia_actividad != null && (
                              <span className="text-[10px] font-bold uppercase tracking-wide text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                Día {transporte.dia_actividad}
                              </span>
                            )}
                            {!transporte.incluido && (
                              <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                                Opcional
                              </span>
                            )}
                          </div>
                          {transporte.descripcion && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {transporte.descripcion}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Accommodation — hoteles reales asociados al paquete. Ahora
                reutiliza el mismo HotelCard.tsx de los resultados de
                búsqueda (con su foto real, calificación de reseñas reales,
                características y precio desde la habitación más barata)
                en vez de una tarjeta propia y más pobre -- así un hotel
                dentro de un paquete se ve y se siente igual que un hotel
                normal, como pidió el usuario. */}
            {pkg.hoteles.length > 0 && (
              <section className="bg-card border border-border rounded-2xl shadow-sm p-8">
                <div className="flex items-center gap-3 mb-6">
                  <HotelIcon className="w-6 h-6 text-primary" />
                  <h2 className="text-2xl font-bold text-foreground">Hospedaje</h2>
                </div>
                <div className="space-y-6">
                  {pkg.hoteles.map((hotel, index) => (
                    <div
                      key={hotel.id_hotel}
                      className={index > 0 ? "pt-6 border-t border-border/60" : ""}
                    >
                      {hotel.noches_incluidas && (
                        <p className="text-xs font-semibold text-primary bg-primary/10 inline-block px-3 py-1 rounded-full mb-3">
                          {hotel.noches_incluidas}{" "}
                          {hotel.noches_incluidas === 1 ? "noche incluida" : "noches incluidas"} en{" "}
                          {hotel.nombre_hotel}
                        </p>
                      )}
                      <HotelCard hotel={hotelesDetalle[hotel.id_hotel]} index={index} />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Personalización */}
            <section className="bg-card border border-border rounded-2xl shadow-sm p-8">
              <div className="flex items-center gap-3 mb-4">
                <Sparkles className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-bold text-foreground">Personaliza tu experiencia</h2>
              </div>
              <p className="text-muted-foreground mb-6">
                Después de reservar puedes agregar actividades y servicios adicionales a tu paquete.
              </p>
              <Link
                to={`/personalize/${pkg.id_paquete}`}
                className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-colors font-semibold"
              >
                Ver opciones de personalización
              </Link>
            </section>
          </div>

          {/* Sidebar - Booking Card */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-2xl shadow-xl p-8 sticky top-24">
              <div className="mb-6">
                <p className="text-muted-foreground mb-2">Precio por persona</p>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-bold text-primary">
                    ${pkg.precio_base.toLocaleString("es-CO")}
                  </span>
                </div>
              </div>

              <div className="space-y-4 mb-6 pb-6 border-b border-border">
                {pkg.duracion_dias && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Duración</span>
                    <span className="font-medium text-foreground">{pkg.duracion_dias} días</span>
                  </div>
                )}
                {pkg.hoteles.length > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Hospedaje</span>
                    <span className="font-medium text-foreground">
                      {pkg.hoteles.length === 1
                        ? (pkg.hoteles[0].calificacion
                            ? `${pkg.hoteles[0].calificacion} estrellas`
                            : pkg.hoteles[0].nombre_hotel)
                        : `${pkg.hoteles.length} hoteles incluidos`}
                    </span>
                  </div>
                )}
                {transportes.length > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Transporte</span>
                    <span className="font-medium text-foreground">
                      {transportes.length === 1
                        ? transportes[0].nombre_servicio
                        : `${transportes.length} tramos incluidos`}
                    </span>
                  </div>
                )}
                {destinoPrincipal && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Destino</span>
                    <span className="font-medium text-foreground">{destinoPrincipal}</span>
                  </div>
                )}
              </div>

              {pkg.hoteles.length > 0 ? (
                // El checkout real reserva una habitación específica de un
                // hotel (ver Checkout.tsx: espera un id_hotel + ?habitacion=)
                // -- todavía no existe un checkout a nivel de PAQUETE, así
                // que cada hotel incluido manda a su propio flujo real de
                // elegir habitación y fecha en vez de simular una reserva
                // de "paquete completo" que el backend no soporta.
                <div className="space-y-2 mb-4">
                  {pkg.hoteles.map((hotel) => (
                    <Link
                      key={hotel.id_hotel}
                      to={`/hotel/${hotel.id_hotel}`}
                      className="block w-full py-3.5 px-4 bg-primary text-primary-foreground text-center font-semibold rounded-xl hover:opacity-90 transition-all duration-300"
                    >
                      {pkg.hoteles.length > 1
                        ? `Reservar en ${hotel.nombre_hotel}`
                        : "Ver hotel y reservar"}
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="w-full py-4 bg-muted text-muted-foreground text-center font-semibold rounded-xl mb-4">
                  Reserva disponible próximamente
                </div>
              )}

              <p className="text-sm text-muted-foreground text-center">
                Pago 100% seguro
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
