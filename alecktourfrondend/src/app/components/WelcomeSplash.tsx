import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { Banner, bannerService, resolveImagenBanner } from "../services/banner.service";

const SESSION_KEY = "alectours_welcome_splash_visto";

// Poster de bienvenida a pantalla completa (sección 7 del brief de
// temática estacional) -- ESTE es "el folleto": el anuncio a pantalla
// completa que ve cualquiera al entrar al sitio, no una sección aparte
// en el Home. Un folleto activo (tipo="folleto", solo imagen + link, el
// texto ya viene dibujado en la imagen -- ver ModuleBanners.tsx) tiene
// prioridad; si no hay ninguno, se cae al banner clásico del carrusel
// (tipo="banner", con título/descripción/botón superpuestos). Sin nada
// activo de ningún tipo, el componente simplemente no renderiza nada.
export default function WelcomeSplash() {
  const [banner, setBanner] = useState<Banner | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Una sola vez por sesión de navegador (no localStorage: se debe
    // volver a mostrar en una sesión/pestaña nueva, pero nunca dos veces
    // en la misma, sin importar cuántas rutas internas se visiten).
    if (sessionStorage.getItem(SESSION_KEY)) return;

    let activo = true;

    const cargar = async () => {
      try {
        const folletos = await bannerService.getActivos("folleto");
        if (!activo) return;
        if (folletos.length > 0) {
          setBanner(folletos[0]);
          setVisible(true);
          return;
        }
        const banners = await bannerService.getActivos("banner");
        if (!activo) return;
        if (banners.length > 0) {
          setBanner(banners[0]);
          setVisible(true);
        }
      } catch {
        // Sin banners/folletos o backend no disponible en este momento --
        // nunca se muestra un splash vacío ni bloquea la navegación por esto.
      }
    };

    cargar();

    return () => {
      activo = false;
    };
  }, []);

  const cerrar = () => {
    setVisible(false);
    sessionStorage.setItem(SESSION_KEY, "1");
  };

  if (!banner) return null;
  const esFolleto = banner.tipo === "folleto";

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

            <div className="relative h-[26rem] sm:h-[30rem] md:h-[34rem] bg-black">
              <motion.img
                src={resolveImagenBanner(banner.imagen_url)}
                alt={banner.titulo}
                initial={{ scale: 1.06 }}
                animate={{ scale: 1 }}
                transition={{ duration: 6, ease: "easeOut" }}
                className={`absolute inset-0 w-full h-full ${esFolleto ? "object-contain" : "object-cover"}`}
              />

              {esFolleto ? (
                // Folleto: sin gradiente ni texto superpuesto -- el folleto ES
                // el anuncio, con el texto ya dibujado en la imagen por quien
                // lo diseñó (ver "Nombre interno", que nunca se muestra, en
                // ModuleBanners.tsx). object-contain arriba para no recortar
                // nunca ese texto. Si trae link, toda la imagen es clicable
                // con un <a> transparente encima (normal, no <Link>: mismo
                // motivo que abajo, este componente vive fuera del Router).
                banner.link_destino && (
                  <a
                    href={banner.link_destino}
                    onClick={cerrar}
                    aria-label={banner.titulo}
                    className="absolute inset-0"
                  />
                )
              ) : (
                <>
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
                      {/* <a> normal, NO <Link> de react-router: este componente se
                          monta a propósito FUERA de <RouterProvider> (ver main.tsx,
                          es un overlay global sobre cualquier ruta) -- un <Link>
                          ahí revienta toda la app con "Cannot destructure property
                          'basename' of useContext(...) as it is null" en cuanto el
                          banner activo trae botón + link (visto en producción). */}
                      {banner.texto_boton && banner.link_destino && (
                        <a
                          href={banner.link_destino}
                          onClick={cerrar}
                          className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground text-sm sm:text-base font-semibold rounded-xl hover:opacity-90 hover:scale-[1.02] transition-all shadow-lg shadow-primary/30"
                        >
                          {banner.texto_boton}
                        </a>
                      )}
                      <button
                        onClick={cerrar}
                        className="text-white/75 hover:text-white text-sm sm:text-base font-medium transition-colors"
                      >
                        Ahora no
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
