import {
  CheckCircle2,
  Clock,
  Hotel as HotelIcon,
  MapPin,
  Sparkles,
  Star,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import Navbar from "../components/Navbar";
import {
  PaqueteDetalleResponse,
  paqueteService,
} from "../services/paquete.service";

// La API no guarda una foto para el paquete, así que usamos un pool de fotos
// reales por ciudad (mismo patrón que HotelDetail.tsx) — nunca inventamos
// datos, solo elegimos una foto ilustrativa del destino real del paquete.
const CITY_IMAGES: Record<string, string> = {
  cartagena: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1400&q=80",
  "santa marta": "https://images.unsplash.com/photo-1596402184320-417e7178b2cd?w=1400&q=80",
  medellín: "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=1400&q=80",
  medellin: "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=1400&q=80",
  bogotá: "https://images.unsplash.com/photo-1605723517503-3cadb5818a0c?w=1400&q=80",
  bogota: "https://images.unsplash.com/photo-1605723517503-3cadb5818a0c?w=1400&q=80",
  cali: "https://images.unsplash.com/photo-1531761535209-180857e963b9?w=1400&q=80",
  salento: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=1400&q=80",
  "villa de leyva": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1400&q=80",
  barranquilla: "https://images.unsplash.com/photo-1519451241324-20b4ea2c4220?w=1400&q=80",
  "san andrés": "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1400&q=80",
  "san andres": "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1400&q=80",
};
const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1400&q=80";

function getImage(ciudad?: string | null) {
  if (!ciudad) return DEFAULT_IMAGE;
  return CITY_IMAGES[ciudad.toLowerCase().trim()] ?? DEFAULT_IMAGE;
}

export default function PackageDetail() {
  const { id } = useParams();
  const [pkg, setPkg] = useState<PaqueteDetalleResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setNotFound(false);
    paqueteService
      .getDetalle(parseInt(id))
      .then(setPkg)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

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
  const heroImage = getImage(pkg.hoteles[0]?.ciudad ?? pkg.destinos[0]);
  const heroPais = pkg.hoteles[0]?.pais ?? "Colombia";

  return (
    <div className="min-h-screen bg-background transition-colors duration-200">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header Image */}
        <div className="relative h-96 md:h-[500px] rounded-3xl overflow-hidden mb-8">
          <img
            src={heroImage}
            alt={destinoPrincipal ?? pkg.nombre_paquete}
            className="w-full h-full object-cover"
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

            {/* What's Included — datos reales de servicios del paquete */}
            <section className="bg-card border border-border rounded-2xl shadow-sm p-8">
              <h2 className="text-2xl font-bold text-foreground mb-6">
                ¿Qué incluye?
              </h2>
              {pkg.servicios.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pkg.servicios.map((servicio, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="text-foreground font-medium">{servicio.nombre_servicio}</span>
                        {servicio.categoria && (
                          <span className="block text-xs text-muted-foreground">{servicio.categoria}</span>
                        )}
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

            {/* Accommodation — hoteles reales asociados al paquete */}
            {pkg.hoteles.length > 0 && (
              <section className="bg-card border border-border rounded-2xl shadow-sm p-8">
                <div className="flex items-center gap-3 mb-6">
                  <HotelIcon className="w-6 h-6 text-primary" />
                  <h2 className="text-2xl font-bold text-foreground">Hospedaje</h2>
                </div>
                <div className="space-y-6">
                  {pkg.hoteles.map((hotel, index) => (
                    <div key={index} className={index > 0 ? "pt-6 border-t border-border/60" : ""}>
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <h3 className="text-xl font-semibold text-foreground">{hotel.nombre_hotel}</h3>
                        {hotel.noches_incluidas && (
                          <span className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">
                            {hotel.noches_incluidas} {hotel.noches_incluidas === 1 ? "noche incluida" : "noches incluidas"}
                          </span>
                        )}
                      </div>
                      {(hotel.ciudad || hotel.pais) && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mb-3">
                          <MapPin className="w-3.5 h-3.5" />
                          {[hotel.ciudad, hotel.pais].filter(Boolean).join(", ")}
                        </p>
                      )}
                      {hotel.calificacion && (
                        <div className="flex gap-1 mb-4">
                          {Array.from({ length: hotel.calificacion }).map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                      )}
                      {hotel.caracteristicas.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {hotel.caracteristicas.map((amenity, i) => (
                            <span
                              key={i}
                              className="px-3 py-1.5 bg-muted text-muted-foreground rounded-full text-xs font-medium"
                            >
                              {amenity}
                            </span>
                          ))}
                        </div>
                      )}
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
                {pkg.hoteles[0] && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Hotel</span>
                    <span className="font-medium text-foreground">
                      {pkg.hoteles[0].calificacion ? `${pkg.hoteles[0].calificacion} estrellas` : pkg.hoteles[0].nombre_hotel}
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

              {pkg.hoteles[0] ? (
                // El checkout real reserva una habitación específica de un
                // hotel (ver Checkout.tsx: espera un id_hotel + ?habitacion=).
                // Antes este botón enlazaba a `/checkout/${pkg.id_paquete}`
                // — un id de PAQUETE tratado como si fuera un id de HOTEL —
                // lo que hacía que, al no encontrar la habitación esperada,
                // Checkout terminara redirigiendo a un /hotel/{id} que ni
                // siquiera correspondía al hotel real del paquete. Ahora se
                // manda al hotel real incluido en el paquete para elegir
                // habitación y fecha por el flujo que sí funciona.
                <Link
                  to={`/hotel/${pkg.hoteles[0].id_hotel}`}
                  className="block w-full py-4 bg-primary text-primary-foreground text-center font-semibold rounded-xl hover:opacity-90 transition-all duration-300 mb-4"
                >
                  Ver hotel y reservar
                </Link>
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
