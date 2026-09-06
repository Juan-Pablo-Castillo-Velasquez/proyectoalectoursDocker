import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Banner, bannerService, resolveImagenBanner } from "../services/banner.service";

// Galería de "folletos" -- piezas tipo afiche (solo imagen + link, el
// texto de la oferta ya viene dibujado en la imagen) administradas desde
// Promociones y banners > "Nuevo folleto" (ver ModuleBanners.tsx).
// Separada a propósito del carrusel de banners (BannersPromocionales.tsx)
// y del splash de bienvenida (WelcomeSplash.tsx) -- esos dos siguen
// mostrando solo tipo="banner", esta sección solo tipo="folleto", nunca
// se mezclan (bannerService.getActivos("folleto")).
//
// No se decora con HalloweenAccentDiscreto a propósito: la pieza subida
// YA es el arte de temporada completo (ese es el sentido de un folleto),
// y es una grilla que puede crecer -- mismo criterio que HotelCard.tsx,
// no repetir un acento en cada tarjeta de una lista.
export default function FolletosGrid() {
  const [folletos, setFolletos] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let activo = true;
    bannerService
      .getActivos("folleto")
      .then((data) => {
        if (activo) setFolletos(data);
      })
      .catch(() => {
        // Sin folletos todavía, o backend no disponible en este momento --
        // la sección simplemente no aparece, nunca rompe la página.
      })
      .finally(() => {
        if (activo) setLoading(false);
      });
    return () => {
      activo = false;
    };
  }, []);

  // Nada que mostrar (recién lanzado a producción y todavía sin ningún
  // folleto creado, por ejemplo) -- nunca deja un bloque vacío ni interfiere.
  if (loading || folletos.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 bg-background transition-colors duration-300">
      <div className="flex items-center gap-2 mb-2">
        <span className="h-px w-8 bg-[var(--chart-2)]" />
        <span className="text-primary text-[11px] font-bold uppercase tracking-[0.2em]">
          Folletos
        </span>
      </div>
      <h2
        className="text-2xl md:text-3xl text-foreground font-medium mb-8"
        style={{ fontFamily: "'Fraunces', serif" }}
      >
        Piezas especiales para ti
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {folletos.map((folleto) => {
          const contenido = (
            <img
              src={resolveImagenBanner(folleto.imagen_url)}
              alt={folleto.titulo}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          );
          const clases =
            "block rounded-2xl overflow-hidden shadow-sm border border-border aspect-[4/5] bg-muted hover:shadow-lg hover:-translate-y-1 transition-all duration-300";

          return folleto.link_destino ? (
            <Link key={folleto.id_banner} to={folleto.link_destino} className={clases}>
              {contenido}
            </Link>
          ) : (
            <div key={folleto.id_banner} className={clases}>
              {contenido}
            </div>
          );
        })}
      </div>
    </section>
  );
}
