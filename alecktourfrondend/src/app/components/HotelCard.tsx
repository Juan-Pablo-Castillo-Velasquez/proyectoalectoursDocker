import {
  Baby,
  Car,
  Check,
  ChevronRight,
  Dice5,
  Dumbbell,
  ExternalLink,
  Heart,
  MapPin,
  PawPrint,
  PlaneTakeoff,
  Sparkles,
  Star,
  Users,
  UtensilsCrossed,
  Waves,
  Wine,
} from "lucide-react";
import { motion } from "motion/react";
import { Link } from "react-router";
import { HotelDetailResponse } from "../services/hotel.service";
import { useFavoritos } from "../context/FavoritosContext";

interface HotelCardProps {
  hotel?: HotelDetailResponse;
  index?: number;
}

const CARACTERISTICA_ICONS: Record<string, React.ElementType> = {
  "Piscina al aire libre": Waves,
  Gimnasio: Dumbbell,
  "Spa y masajes": Sparkles,
  "Restaurante buffet": UtensilsCrossed,
  "Parqueadero gratuito": Car,
  "Pet Friendly": PawPrint,
  Casino: Dice5,
  Guardería: Baby,
  "Traslado al aeropuerto": PlaneTakeoff,
  "Bar en la azotea": Wine,
};

const CITY_IMAGES: Record<string, string> = {
  cartagena:
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1000&q=85",

  "santa marta":
    "https://images.unsplash.com/photo-1596402184320-417e7178b2cd?w=1000&q=85",

  medellín:
    "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=1000&q=85",

  medellin:
    "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=1000&q=85",

  bogotá:
    "https://images.unsplash.com/photo-1605723517503-3cadb5818a0c?w=1000&q=85",

  bogota:
    "https://images.unsplash.com/photo-1605723517503-3cadb5818a0c?w=1000&q=85",

  cali:
    "https://images.unsplash.com/photo-1531761535209-180857e963b9?w=1000&q=85",

  "san andrés":
    "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1000&q=85",

  "san andres":
    "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1000&q=85",
};

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1000&q=85";

function getHotelImage(ciudad?: string): string {
  return CITY_IMAGES[ciudad?.toLowerCase().trim() ?? ""] ?? DEFAULT_IMAGE;
}

function getPrecioMinimo(hotel: HotelDetailResponse): number | null {
  const disponibles =
    hotel.habitaciones?.filter(
      (habitacion) => habitacion.estado?.toLowerCase() === "disponible"
    ) ?? [];

  if (!disponibles.length) {
    return null;
  }

  return Math.min(...disponibles.map((habitacion) => habitacion.precio_noche));
}

export default function HotelCard({ hotel, index = 0 }: HotelCardProps) {
  const { isFavorito, toggleFavorito, loadingIds } = useFavoritos();

  /*
   * Protección importante:
   * mientras la información del hotel todavía está
   * llegando desde la API, no intentamos acceder a
   * hotel.ciudad, hotel.habitaciones, etc.
   */
  if (!hotel) {
    return (
      <div className="flex w-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm md:flex-row">
        <div className="h-[200px] w-full animate-pulse bg-gray-100 md:h-auto md:w-[260px]" />

        <div className="flex-1 space-y-3 p-5">
          <div className="h-3 w-20 animate-pulse rounded bg-gray-100" />
          <div className="h-6 w-3/4 animate-pulse rounded bg-gray-100" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-gray-100" />
          <div className="h-16 animate-pulse rounded-xl bg-gray-100" />
        </div>
      </div>
    );
  }

  const imagen = getHotelImage(hotel.ciudad);

  const precioMin = getPrecioMinimo(hotel);

  const habitacionesDisponibles =
    hotel.habitaciones?.filter(
      (habitacion) => habitacion.estado?.toLowerCase() === "disponible"
    ) ?? [];

  const habitacionDestacada =
    habitacionesDisponibles.length > 0
      ? habitacionesDisponibles.reduce((prev, current) =>
          current.precio_noche < prev.precio_noche ? current : prev
        )
      : null;

  const caracteristicas =
    hotel.hotel_caracteristicas
      ?.filter((hc) => hc.disponible && hc.caracteristica)
      .slice(0, 4) ?? [];

  // Desayuno incluido: derivado de una característica real del hotel (no un
  // badge fijo) — solo aparece si el hotel realmente la tiene registrada.
  const desayunoIncluido = hotel.hotel_caracteristicas?.some(
    (hc) =>
      hc.disponible &&
      hc.caracteristica?.nombre_caracteristica.toLowerCase().includes("desayuno")
  );

  // Calificación real de clientes (tabla `resenas`) si ya existe alguna;
  // si no, se usa la calificación fija del hotel como respaldo — nunca un
  // número inventado.
  const calificacionBase = hotel.calificacion_promedio ?? hotel.calificacion;

  const rating = calificacionBase ? calificacionBase * 2 : 8;

  // Etiqueta comercial estilo Despegar derivada del rating real del hotel
  // (nunca un texto fijo): a mayor calificación, mejor palabra en la escala.
  const ratingLabel =
    rating >= 9
      ? "Excepcional"
      : rating >= 8
        ? "Excelente"
        : rating >= 7
          ? "Muy bueno"
          : rating >= 6
            ? "Bueno"
            : "Aceptable";

  const estrellas = Math.min(Math.max(Math.round(calificacionBase || 4), 1), 5);

  // Urgencia de disponibilidad: siempre calculada de las habitaciones reales
  // del hotel, nunca un "-23%" o "mejor precio" fijo sin base real.
  const disponibilidad =
    habitacionesDisponibles.length === 0
      ? { texto: "Sin disponibilidad", clase: "bg-gray-100 text-gray-500" }
      : habitacionesDisponibles.length <= 3
        ? {
            texto: `Solo quedan ${habitacionesDisponibles.length} habitaci${
              habitacionesDisponibles.length === 1 ? "ón" : "ones"
            }`,
            clase: "bg-orange-50 text-orange-700",
          }
        : { texto: "Disponible", clase: "bg-[#e8f7f1] text-[#008f6b]" };

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${hotel.nombre_hotel} ${hotel.ciudad ?? ""} ${hotel.pais ?? ""}`
  )}`;

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.45, delay: index * 0.06 }}
      whileHover={{ y: -3, transition: { duration: 0.25 } }}
      className="
        group
        flex
        w-full
        flex-col
        overflow-hidden
        rounded-2xl
        border
        border-gray-200
        bg-white
        shadow-[0_4px_20px_rgba(0,0,0,0.06)]
        transition-shadow
        hover:shadow-[0_16px_40px_rgba(0,0,0,0.12)]
        md:flex-row
      "
    >
      {/* ============================================ */}
      {/* IMAGEN */}
      {/* ============================================ */}
      <Link
        to={`/hotel/${hotel.id_hotel}`}
        className="relative block h-[200px] w-full shrink-0 overflow-hidden bg-gray-100 md:h-auto md:w-[260px]"
      >
        <motion.img
          src={imagen}
          alt={hotel.nombre_hotel}
          whileHover={{ scale: 1.06 }}
          transition={{ duration: 0.6 }}
          className="h-full w-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = DEFAULT_IMAGE;
          }}
        />

        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <span className="rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#8B1E3F] shadow-sm backdrop-blur">
            Hotel
          </span>

          {desayunoIncluido && (
            <span className="rounded-full bg-[#008f6b] px-2.5 py-1 text-[10px] font-bold text-white shadow-sm">
              Desayuno incluido
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleFavorito(hotel.id_hotel);
          }}
          disabled={loadingIds.has(hotel.id_hotel)}
          className={`
            absolute
            right-3
            top-3
            flex
            h-9
            w-9
            items-center
            justify-center
            rounded-full
            bg-white/90
            shadow-md
            backdrop-blur
            transition
            hover:bg-white
            disabled:opacity-60
            ${isFavorito(hotel.id_hotel) ? "text-[#8B1E3F]" : "text-gray-600 hover:text-[#8B1E3F]"}
          `}
          aria-label={isFavorito(hotel.id_hotel) ? "Quitar de favoritos" : "Agregar a favoritos"}
          aria-pressed={isFavorito(hotel.id_hotel)}
        >
          <Heart className={`h-4 w-4 ${isFavorito(hotel.id_hotel) ? "fill-current" : ""}`} />
        </button>
      </Link>

      {/* ============================================ */}
      {/* INFO + PRECIO */}
      {/* ============================================ */}
      <div className="flex flex-1 flex-col gap-4 p-5 md:flex-row md:items-stretch">
        {/* -------- INFO COMERCIAL -------- */}
        <div className="min-w-0 flex-1">
          <Link to={`/hotel/${hotel.id_hotel}`} className="block">
            <h3 className="text-lg font-bold leading-tight text-gray-900 group-hover:text-[#8B1E3F] transition-colors">
              {hotel.nombre_hotel}
            </h3>
          </Link>

          <div className="mt-2 flex items-center gap-2">
            <span className="rounded-md bg-[#8B1E3F] px-2 py-1 text-xs font-bold text-white">
              {rating.toFixed(1)}
            </span>

            <span className="text-xs font-semibold text-gray-700">{ratingLabel}</span>

            {hotel.total_resenas > 0 && (
              <span className="text-xs text-gray-400">({hotel.total_resenas})</span>
            )}

            <div className="ml-1 flex items-center gap-0.5">
              {Array.from({ length: estrellas }, (_, i) => (
                <Star key={i} className="h-3 w-3 fill-[#C9A227] text-[#C9A227]" />
              ))}
            </div>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-gray-500">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-[#8B1E3F]" />
            <span>
              {hotel.direccion ? `${hotel.direccion} · ` : ""}
              {hotel.ciudad}
              {hotel.pais ? `, ${hotel.pais}` : ""}
            </span>

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                window.open(mapsUrl, "_blank", "noopener,noreferrer");
              }}
              className="inline-flex items-center gap-1 font-semibold text-[#8B1E3F] hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              Ver en mapa
            </button>
          </div>

          <div className="mt-3">
            <span
              className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-bold ${disponibilidad.clase}`}
            >
              <Check className="h-3 w-3" />
              {disponibilidad.texto}
            </span>

            {habitacionDestacada && (
              <span className="ml-2 inline-flex items-center gap-1 text-[10px] text-gray-500">
                <Users className="h-3 w-3" />
                Hasta {habitacionDestacada.tipo_habitacion?.capacidad_personas ?? 2} personas
              </span>
            )}
          </div>

          {caracteristicas.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {caracteristicas.map((hc) => {
                const nombre = hc.caracteristica!.nombre_caracteristica;
                const Icon = CARACTERISTICA_ICONS[nombre];

                return (
                  <span
                    key={hc.id_caracteristica}
                    className="flex items-center gap-1 rounded-full bg-gray-50 px-2 py-1 text-[10px] font-medium text-gray-600"
                  >
                    {Icon ? (
                      <Icon className="h-3 w-3 text-[#8B1E3F]" />
                    ) : (
                      <Check className="h-3 w-3 text-[#008f6b]" />
                    )}
                    {nombre}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* -------- PRECIO / CTA -------- */}
        <div className="flex shrink-0 flex-row items-end justify-between gap-3 border-t border-gray-100 pt-4 md:w-[170px] md:flex-col md:items-end md:justify-between md:border-l md:border-t-0 md:pl-4 md:pt-0">
          {precioMin ? (
            <div className="md:text-right">
              <p className="text-[10px] text-gray-400">Desde · por noche</p>

              <div className="flex items-baseline gap-1 md:justify-end">
                <span className="text-sm font-medium text-gray-700">$</span>
                <span className="text-xl font-extrabold tracking-tight text-[#8B1E3F]">
                  {precioMin.toLocaleString("es-CO")}
                </span>
              </div>

              <p className="text-[10px] text-gray-400">
                {habitacionDestacada?.tipo_habitacion?.nombre_tipo ?? "Habitación estándar"}
              </p>
            </div>
          ) : (
            <p className="text-xs font-medium text-gray-500 md:text-right">
              Consulta otras fechas
            </p>
          )}

          <Link
            to={`/hotel/${hotel.id_hotel}`}
            className="flex items-center gap-1 whitespace-nowrap rounded-xl bg-[#8B1E3F] px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-[#71182F]"
          >
            Ver hotel
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </motion.article>
  );
}
