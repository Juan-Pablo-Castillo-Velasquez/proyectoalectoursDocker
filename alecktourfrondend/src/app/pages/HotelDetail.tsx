import {
  ArrowLeft,
  Baby,
  Bed,
  Car,
  CheckCircle,
  Clock,
  CreditCard,
  Dice5,
  Dumbbell,
  Heart,
  Info,
  MapPin,
  PawPrint,
  PlaneTakeoff,
  Share,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  UtensilsCrossed,
  Waves,
  Wine,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { toast } from "sonner";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import { useFavoritos } from "../context/FavoritosContext";
import {
  HabitacionResponse,
  HotelDetailResponse,
  hotelService,
} from "../services/hotel.service";

// ── Mapa de íconos de características con colores semánticos basados en tu tema ──
const CARACTERISTICA_ICONS: Record<
  string,
  { icon: React.ElementType; color: string }
> = {
  "Piscina al aire libre": { icon: Waves, color: "text-primary" },
  Gimnasio: { icon: Dumbbell, color: "text-chart-1" },
  "Spa y masajes": { icon: Sparkles, color: "text-chart-5" },
  "Restaurante buffet": { icon: UtensilsCrossed, color: "text-chart-2" },
  "Parqueadero gratuito": { icon: Car, color: "text-muted-foreground" },
  "Pet Friendly": { icon: PawPrint, color: "text-chart-2" },
  Casino: { icon: Dice5, color: "text-destructive" },
  Guardería: { icon: Baby, color: "text-chart-5" },
  "Traslado al aeropuerto": { icon: PlaneTakeoff, color: "text-primary" },
  "Bar en la azotea": { icon: Wine, color: "text-destructive" },
};

const CITY_IMAGES: Record<string, string> = {
  cartagena:
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80",
  "santa marta":
    "https://images.unsplash.com/photo-1596402184320-417e7178b2cd?w=1200&q=80",
  medellín:
    "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=1200&q=80",
  medellin:
    "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=1200&q=80",
  bogotá:
    "https://images.unsplash.com/photo-1605723517503-3cadb5818a0c?w=1200&q=80",
  bogota:
    "https://images.unsplash.com/photo-1605723517503-3cadb5818a0c?w=1200&q=80",
  cali: "https://images.unsplash.com/photo-1531761535209-180857e963b9?w=1200&q=80",
  salento:
    "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=1200&q=80",
  "villa de leyva":
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80",
  barranquilla:
    "https://images.unsplash.com/photo-1519451241324-20b4ea2c4220?w=1200&q=80",
  "san andrés":
    "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&q=80",
  "san andres":
    "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&q=80",
};
const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80";

// Imágenes genéricas de lujo para la galería Bento Grid
const GALLERY_FILLERS = [
  "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80",
  "https://images.unsplash.com/photo-1542314831-c6a4d140f6c2?w=800&q=80",
  "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&q=80",
  "https://images.unsplash.com/photo-1590490359683-658d34c8f90f?w=800&q=80",
];

// La API no guarda foto por habitación individual, así que usamos un pool
// determinístico de fotos de habitación reales (mismo id -> misma foto siempre).
const ROOM_IMAGES = [
  "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=600&q=80",
  "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=600&q=80",
  "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80",
  "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=600&q=80",
];

function getRoomImage(idHabitacion: number) {
  return ROOM_IMAGES[idHabitacion % ROOM_IMAGES.length];
}

function getImage(ciudad: string) {
  return CITY_IMAGES[ciudad?.toLowerCase().trim()] ?? DEFAULT_IMAGE;
}

// Estados mapeados usando opacidades de tus tokens globales o semánticos
const ESTADO_STYLES: Record<string, string> = {
  disponible:
    "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
  ocupada: "bg-destructive/10 text-destructive border-destructive/20",
  mantenimiento: "bg-chart-2/10 text-chart-2 border-chart-2/20",
};

export default function HotelDetail() {
  const { id } = useParams();
  const { isFavorito, toggleFavorito, loadingIds } = useFavoritos();
  const [hotel, setHotel] = useState<HotelDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedHabitacion, setSelectedHabitacion] =
    useState<HabitacionResponse | null>(null);

  useEffect(() => {
    if (!id) return;
    hotelService
      .getById(parseInt(id))
      .then(setHotel)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading)
    return (
      <div className="min-h-screen bg-background transition-colors duration-200">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse">
          <div className="h-5 w-32 bg-muted rounded mb-6" />
          <div className="h-[50vh] bg-muted rounded-2xl mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-40 bg-card border border-border rounded-2xl" />
              <div className="h-96 bg-card border border-border rounded-2xl" />
            </div>
            <div className="h-[400px] bg-card border border-border rounded-2xl" />
          </div>
        </div>
      </div>
    );

  if (!hotel)
    return (
      <div className="min-h-screen bg-background transition-colors duration-200">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <div className="bg-muted w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <MapPin className="w-8 h-8 text-muted-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-4">
            Hotel no encontrado
          </h1>
          <Link
            to="/search"
            className="text-primary hover:underline font-medium"
          >
            ← Volver a explorar destinos
          </Link>
        </div>
      </div>
    );

  const imagen = getImage(hotel.ciudad ?? "");
  const habitacionesDisponibles =
    hotel.habitaciones?.filter((h) => h.estado === "disponible") ?? [];
  const precioMin = habitacionesDisponibles.length
    ? Math.min(...habitacionesDisponibles.map((h) => h.precio_noche))
    : null;
  const caracteristicas = hotel.hotel_caracteristicas ?? [];

  const checkoutHref = selectedHabitacion
    ? `/checkout/${hotel.id_hotel}?habitacion=${selectedHabitacion.id_habitacion}`
    : "#";

  const handleCompartir = async () => {
    const texto = `${hotel.nombre_hotel} — ${hotel.ciudad}, ${hotel.pais}`;
    const url = window.location.href;

    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await (navigator as any).share({ title: hotel.nombre_hotel, text: texto, url });
        return;
      } catch (err: any) {
        if (err?.name === "AbortError") return;
        // Cae al portapapeles si el share nativo falla por otra razón.
      }
    }

    try {
      await navigator.clipboard.writeText(`${texto}\n${url}`);
      toast.success("Enlace del hotel copiado al portapapeles");
    } catch {
      toast.error("No se pudo compartir este hotel");
    }
  };

  return (
    <>
      <div className="min-h-screen bg-background text-foreground transition-colors duration-200 pb-20">
        <Navbar />

        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Breadcrumbs Comercial */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <nav className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link
                to="/search"
                className="hover:text-primary transition-colors flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" /> Búsqueda
              </Link>
              <span>/</span>
              <span className="font-medium text-foreground">{hotel.pais}</span>
              <span>/</span>
              <span className="font-medium text-foreground">
                {hotel.ciudad}
              </span>
            </nav>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleCompartir}
                className="flex items-center gap-2 text-sm font-medium hover:bg-muted px-3 py-1.5 rounded-md transition-colors"
              >
                <Share className="w-4 h-4" /> Compartir
              </button>
              <button
                type="button"
                onClick={() => toggleFavorito(hotel.id_hotel)}
                disabled={loadingIds.has(hotel.id_hotel)}
                aria-pressed={isFavorito(hotel.id_hotel)}
                className={`flex items-center gap-2 text-sm font-medium hover:bg-muted px-3 py-1.5 rounded-md transition-colors disabled:opacity-60 ${
                  isFavorito(hotel.id_hotel) ? "text-primary" : ""
                }`}
              >
                <Heart className={`w-4 h-4 ${isFavorito(hotel.id_hotel) ? "fill-current" : ""}`} />
                {isFavorito(hotel.id_hotel) ? "Guardado" : "Guardar"}
              </button>
            </div>
          </div>

          {/* Título Comercial */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider">
                Hotel Destacado
              </span>
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${i < (hotel.calificacion ?? 0) ? "fill-chart-2 text-chart-2" : "fill-muted text-muted"}`}
                  />
                ))}
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-2">
              {hotel.nombre_hotel}
            </h1>
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="hover:underline cursor-pointer">
                {hotel.direccion || "Ubicación céntrica"}, {hotel.ciudad}
              </span>
              <span>•</span>
              <span className="text-primary font-medium cursor-pointer hover:underline">
                Ver mapa
              </span>
            </div>
          </div>

          {/* Galería de Imágenes (Estilo Bento Grid) */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-10 h-[45vh] md:h-[55vh] rounded-2xl overflow-hidden group">
            <div className="md:col-span-2 md:row-span-2 relative overflow-hidden h-full">
              <img
                src={imagen}
                alt={hotel.nombre_hotel}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = DEFAULT_IMAGE;
                }}
              />
            </div>
            {GALLERY_FILLERS.map((img, idx) => (
              <div
                key={idx}
                className="hidden md:block relative overflow-hidden h-full"
              >
                <img
                  src={img}
                  alt="Instalaciones"
                  className="w-full h-full object-cover hover:opacity-90 transition-opacity cursor-pointer"
                />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* ── Columna Principal (Izquierda) ── */}
            <div className="lg:col-span-2 space-y-10">
              {/* Acerca de */}
              <section>
                <h2 className="text-2xl font-semibold mb-4">
                  Acerca de este alojamiento
                </h2>
                <div className="prose prose-sm md:prose-base dark:prose-invert text-muted-foreground">
                  <p>
                    Ubicado estratégicamente en <strong>{hotel.ciudad}</strong>,{" "}
                    {hotel.nombre_hotel} ofrece una experiencia excepcional que
                    combina comodidad moderna con la calidez del servicio local.
                    Ideal tanto para estancias de negocios como para escapadas
                    de turismo.
                  </p>
                  <p className="mt-4">
                    Nuestros huéspedes destacan la limpieza, la atención del
                    personal y nuestra ubicación privilegiada cerca de los
                    principales puntos de interés. Siéntete como en casa
                    mientras descubres lo mejor de {hotel.pais}.
                  </p>
                </div>
              </section>

              <hr className="border-border" />

              {/* Servicios y Amenidades — tabla con lo que realmente incluye
                  este hotel (hotel.hotel_caracteristicas, dato real, no un
                  badge genérico repetido en cada habitación). */}
              {caracteristicas.filter((hc) => hc.disponible).length > 0 && (
                <section>
                  <h2 className="text-2xl font-semibold mb-6">
                    Qué incluye este hotel
                  </h2>
                  <div className="rounded-2xl border border-border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted/40 border-b border-border">
                          <th className="text-left font-semibold text-muted-foreground uppercase tracking-wider text-xs px-5 py-3">
                            Servicio
                          </th>
                          <th className="text-right font-semibold text-muted-foreground uppercase tracking-wider text-xs px-5 py-3">
                            Incluido
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {caracteristicas
                          .filter((hc) => hc.disponible)
                          .map((hc, idx) => {
                            const nombre =
                              hc.caracteristica?.nombre_caracteristica ?? "";
                            const entry = CARACTERISTICA_ICONS[nombre];
                            const Icon = entry?.icon || CheckCircle;
                            const color = entry?.color || "text-primary";

                            return (
                              <tr
                                key={hc.id_caracteristica}
                                className={idx > 0 ? "border-t border-border/60" : ""}
                              >
                                <td className="px-5 py-3.5">
                                  <span className="flex items-center gap-3 font-medium text-foreground/90">
                                    <Icon className={`w-4.5 h-4.5 ${color} shrink-0`} />
                                    {nombre}
                                  </span>
                                </td>
                                <td className="px-5 py-3.5 text-right">
                                  <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 font-semibold text-xs">
                                    <CheckCircle className="w-4 h-4" />
                                    Sí
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              <hr className="border-border" />

              {/* Listado de Habitaciones — DISEÑO OPTIMIZADO */}
              {hotel.habitaciones?.length > 0 && (
                <section id="habitaciones">
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-4">
                    <div>
                      <h2 className="text-2xl font-semibold">Disponibilidad</h2>
                      <p className="text-muted-foreground mt-1 text-sm">
                        Selecciona una habitación para proceder con la reserva.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {hotel.habitaciones.map((hab) => {
                      const disponible = hab.estado === "disponible";
                      const seleccionada =
                        selectedHabitacion?.id_habitacion === hab.id_habitacion;

                      return (
                        <motion.div
                          key={hab.id_habitacion}
                          whileHover={
                            disponible && !seleccionada ? { y: -2 } : {}
                          }
                          onClick={() =>
                            disponible && setSelectedHabitacion(hab)
                          }
                          className={`relative flex flex-col md:flex-row border rounded-2xl overflow-hidden transition-all duration-300 bg-card ${
                            !disponible
                              ? "opacity-60 grayscale-[40%] cursor-not-allowed"
                              : seleccionada
                                ? "border-primary ring-2 ring-primary/20 shadow-lg cursor-default"
                                : "border-border hover:border-primary/40 hover:shadow-md cursor-pointer"
                          }`}
                        >
                          {/* Foto de la habitación */}
                          <div className="relative h-40 md:h-auto md:w-48 shrink-0 overflow-hidden bg-muted">
                            <img
                              src={getRoomImage(hab.id_habitacion)}
                              alt={hab.tipo_habitacion?.nombre_tipo ?? "Habitación"}
                              className={`h-full w-full object-cover ${!disponible ? "grayscale" : ""}`}
                            />
                          </div>

                          {/* Info de la Habitación */}
                          <div className="p-5 md:p-6 flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                                {hab.tipo_habitacion?.nombre_tipo ??
                                  "Habitación"}
                              </h3>
                              <span
                                className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ${ESTADO_STYLES[hab.estado]}`}
                              >
                                {hab.estado}
                              </span>
                            </div>

                            {hab.tipo_habitacion?.descripcion && (
                              <p className="text-sm text-muted-foreground mb-4 max-w-lg">
                                {hab.tipo_habitacion.descripcion}
                              </p>
                            )}

                            <div className="flex items-center gap-4 text-sm text-muted-foreground font-medium">
                              <span className="flex items-center gap-1.5">
                                <Bed className="w-4 h-4 text-primary" /> Cama
                                doble
                              </span>
                              <span className="flex items-center gap-1.5">
                                <Users className="w-4 h-4 text-primary" /> Máx.{" "}
                                {hab.tipo_habitacion?.capacidad_personas} pers.
                              </span>
                            </div>
                          </div>

                          {/* Caja de Precio (Lado derecho en Desktop) */}
                          <div className="bg-muted/30 p-5 md:p-6 flex flex-col justify-center items-start md:items-end md:w-64 border-t md:border-t-0 md:border-l border-border">
                            <p className="text-xs text-muted-foreground font-medium mb-1">
                              Precio por 1 noche
                            </p>
                            <p className="text-2xl font-bold text-primary mb-1">
                              $
                              {Number(hab.precio_noche).toLocaleString("es-CO")}
                            </p>
                            <p className="text-[11px] text-muted-foreground mb-4">
                              Incluye impuestos y cargos
                            </p>

                            <button
                              disabled={!disponible}
                              className={`w-full py-2.5 px-4 rounded-xl font-bold text-sm transition-all ${
                                !disponible
                                  ? "bg-muted text-muted-foreground border border-border"
                                  : seleccionada
                                    ? "bg-primary text-primary-foreground shadow-md ring-2 ring-primary ring-offset-1 ring-offset-background"
                                    : "bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground"
                              }`}
                            >
                              {!disponible
                                ? "No disponible"
                                : seleccionada
                                  ? "Seleccionada"
                                  : "Elegir"}
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </section>
              )}

              <hr className="border-border" />

              {/* Políticas simuladas */}
              <section>
                <h2 className="text-2xl font-semibold mb-6">
                  Reglas del alojamiento
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex gap-4 p-5 rounded-2xl border border-border bg-card">
                    <Clock className="w-6 h-6 text-primary shrink-0" />
                    <div>
                      <h4 className="font-semibold text-foreground">
                        Horarios
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Check-in: 15:00 - 23:00
                        <br />
                        Check-out: Hasta las 12:00
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4 p-5 rounded-2xl border border-border bg-card">
                    <Info className="w-6 h-6 text-primary shrink-0" />
                    <div>
                      <h4 className="font-semibold text-foreground">
                        Políticas
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Se requiere presentar documento de identidad al momento
                        del registro.
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* ── Sidebar de Reserva (Sticky) ── */}
            <div className="lg:col-span-1 relative">
              <div className="bg-card rounded-2xl border border-border p-6 shadow-xl sticky top-24 transition-colors">
                {/* Gatillo de Urgencia (FOMO) */}
                <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3 mb-6 flex items-start gap-3">
                  <span className="relative flex h-2.5 w-2.5 mt-1.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-destructive"></span>
                  </span>
                  <div className="text-sm text-destructive dark:text-red-400">
                    <span className="font-bold block">¡Muy solicitado!</span>
                    Este hotel se reserva frecuentemente.
                  </div>
                </div>

                {/* Info superior */}
                <div className="mb-6">
                  <h3 className="text-xl font-bold leading-tight mb-2">
                    {hotel.nombre_hotel}
                  </h3>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div className="flex justify-between">
                      <span>Destino</span>
                      <span className="font-medium text-foreground">
                        {hotel.ciudad}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Contacto</span>
                      <span className="font-medium text-foreground">
                        {hotel.telefono}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Caja de Precio Dinámica */}
                <div className="bg-muted/40 rounded-xl p-5 mb-6 border border-border">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-foreground">
                      {selectedHabitacion
                        ? selectedHabitacion.tipo_habitacion?.nombre_tipo
                        : "Selecciona habitación"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-muted-foreground mb-4">
                    <span>
                      1 Noche,{" "}
                      {selectedHabitacion
                        ? selectedHabitacion.tipo_habitacion?.capacidad_personas
                        : "2"}{" "}
                      pers.
                    </span>
                  </div>

                  <div className="border-t border-border pt-4 flex justify-between items-end">
                    <span className="font-bold text-foreground">Total</span>
                    <div className="text-right">
                      <span className="text-2xl font-black text-primary">
                        $
                        {(
                          selectedHabitacion?.precio_noche ??
                          precioMin ??
                          0
                        ).toLocaleString("es-CO")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Botón de Checkout */}
                <Link
                  to={checkoutHref}
                  onClick={(e) => {
                    if (!selectedHabitacion) {
                      e.preventDefault();
                      document
                        .getElementById("habitaciones")
                        ?.scrollIntoView({ behavior: "smooth" });
                    }
                  }}
                  className={`flex justify-center items-center w-full py-4 text-base font-bold rounded-xl transition-all ${
                    selectedHabitacion
                      ? "bg-primary text-primary-foreground shadow-md hover:scale-[1.02] hover:shadow-lg"
                      : "bg-primary/50 text-white cursor-pointer"
                  }`}
                >
                  {selectedHabitacion
                    ? "Reservar ahora"
                    : "Ver opciones de habitación"}
                </Link>
                <p className="text-xs text-center text-muted-foreground mt-3 font-medium">
                  No se te cobrará nada todavía
                </p>

                {/* Badges de confianza */}
                <div className="mt-6 pt-6 border-t border-border space-y-4">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <ShieldCheck className="w-5 h-5 text-green-500 shrink-0" />
                    <span>Transacción segura y cifrada</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <CreditCard className="w-5 h-5 text-blue-500 shrink-0" />
                    <span>Aceptamos múltiples métodos de pago</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
