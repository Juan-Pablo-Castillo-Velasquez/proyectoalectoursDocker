import { ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Banner, bannerService, resolveImagenBanner } from "../services/banner.service";

const AUTO_AVANCE_MS = 6000;

// Carrusel de banners publicitarios (sección 7 del plan de mejora) — a
// diferencia de OffersHighlight.tsx (que sí tiene datos reales de hoteles),
// este contenido es 100% administrado a mano desde ModuleBanners.tsx, así
// que si el admin no ha creado ninguno la sección simplemente no se
// renderiza (mismo criterio que el resto del home: nunca un bloque vacío).
export default function BannersPromocionales() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let activo = true;
    bannerService
      .getActivos("banner") // nunca folletos (esos solo van en el splash de bienvenida, ver WelcomeSplash.tsx)
      .then((data) => { if (activo) setBanners(data); })
      .catch((err) => console.error("Error cargando banners:", err))
      .finally(() => { if (activo) setLoading(false); });
    return () => { activo = false; };
  }, []);

  useEffect(() => {
    if (banners.length < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % banners.length), AUTO_AVANCE_MS);
    return () => clearInterval(id);
  }, [banners.length]);

  if (loading || banners.length === 0) return null;

  const banner = banners[index % banners.length];
  const anterior = () => setIndex((i) => (i - 1 + banners.length) % banners.length);
  const siguiente = () => setIndex((i) => (i + 1) % banners.length);

  const Contenido = (
    <>
      <img
        src={resolveImagenBanner(banner.imagen_url)}
        alt={banner.titulo}
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      <div className="absolute bottom-6 left-6 right-6 sm:bottom-10 sm:left-10 sm:right-10 text-white">
        <h3 className="text-xl sm:text-3xl font-bold mb-1" style={{ fontFamily: "'Fraunces', serif" }}>
          {banner.titulo}
        </h3>
        {banner.descripcion_corta && (
          <p className="text-white/80 text-sm sm:text-base mb-3 max-w-xl">{banner.descripcion_corta}</p>
        )}
        {banner.texto_boton && (
          <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-xl">
            {banner.texto_boton}
          </span>
        )}
      </div>
    </>
  );

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="relative h-64 sm:h-80 lg:h-96 rounded-2xl overflow-hidden shadow-lg">
        <AnimatePresence mode="wait">
          <motion.div
            key={banner.id_banner}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0"
          >
            {banner.link_destino ? (
              <Link to={banner.link_destino} className="block relative w-full h-full">
                {Contenido}
              </Link>
            ) : (
              <div className="relative w-full h-full">{Contenido}</div>
            )}
          </motion.div>
        </AnimatePresence>

        {banners.length > 1 && (
          <>
            <button
              onClick={anterior}
              aria-label="Banner anterior"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={siguiente}
              aria-label="Siguiente banner"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
              {banners.map((b, i) => (
                <button
                  key={b.id_banner}
                  onClick={() => setIndex(i)}
                  aria-label={`Ir al banner ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all ${i === index % banners.length ? "w-6 bg-white" : "w-1.5 bg-white/50"}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
