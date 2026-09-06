import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Banner, bannerService, resolveImagenBanner } from "../services/banner.service";

const SESSION_KEY = "alectours_welcome_splash_visto";

// Poster de bienvenida a pantalla completa (sección 7 del brief de
// temática estacional) -- a propósito NO crea contenido nuevo: reutiliza
// el mismo banner que ya carga BannersPromocionales.tsx (GET
// /banners/activos, ya filtrado en el backend por la temporada realmente
// activa vía Banner.temporada, ver banner_repository.py). Si el admin
// activó Halloween y tiene un banner marcado a esa temporada, este es el
// que aparece acá también -- si no hay ningún banner activo, este
// componente simplemente no renderiza nada.
export default function WelcomeSplash() {
  const [banner, setBanner] = useState<Banner | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Una sola vez por sesión de navegador (no localStorage: se debe
    // volver a mostrar en una sesión/pestaña nueva, pero nunca dos veces
    // en la misma, sin importar cuántas rutas internas se visiten).
    if (sessionStorage.getItem(SESSION_KEY)) return;

    let activo = true;
    bannerService
      .getActivos()
      .then((data) => {
        if (!activo || data.length === 0) return;
        setBanner(data[0]);
        setVisible(true);
      })
      .catch(() => {
        // Sin banners o backend no disponible en este momento -- nunca se
        // muestra un splash vacío ni bloquea la navegación por esto.
      });

    return () => {
      activo = false;
    };
  }, []);

  const cerrar = () => {
    setVisible(false);
    sessionStorage.setItem(SESSION_KEY, "1");
  };

  if (!banner) return null;

  return (
    // bg-black/90 + blur-md (antes /70 + blur-sm): con overlay más liviano se
    // alcanzaba a notar contenido de la página detrás (títulos/números
    // grandes) a través del blur, sobre todo con banners de alto contraste.
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[10050] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
          onClick={cerrar}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg sm:max-w-xl md:max-w-2xl rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/10"
          >
            <button
              onClick={cerrar}
              aria-label="Cerrar"
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors backdrop-blur-sm"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="relative h-[26rem] sm:h-[30rem] md:h-[34rem]">
              <motion.img
                src={resolveImagenBanner(banner.imagen_url)}
                alt={banner.titulo}
                initial={{ scale: 1.06 }}
                animate={{ scale: 1 }}
                transition={{ duration: 6, ease: "easeOut" }}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/10" />

              <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 text-white">
                <h2
                  className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2"
                  style={{ fontFamily: "'Fraunces', serif" }}
                >
                  {banner.titulo}
                </h2>
                {banner.descripcion_corta && (
                  <p className="text-white/85 text-sm sm:text-base mb-5 max-w-md">{banner.descripcion_corta}</p>
                )}
                <div className="flex items-center gap-4">
                  {banner.texto_boton && banner.link_destino && (
                    <Link
                      to={banner.link_destino}
                      onClick={cerrar}
                      className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground text-sm sm:text-base font-semibold rounded-xl hover:opacity-90 hover:scale-[1.02] transition-all shadow-lg shadow-primary/30"
                    >
                      {banner.texto_boton}
                    </Link>
                  )}
                  <button
                    onClick={cerrar}
                    className="text-white/75 hover:text-white text-sm sm:text-base font-medium transition-colors"
                  >
                    Ahora no
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
