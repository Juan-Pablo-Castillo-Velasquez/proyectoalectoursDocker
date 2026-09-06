import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Banner, bannerService, resolveImagenBanner } from "../services/banner.service";

// ⚠️ SIN USAR (no se importa en ningún lado) -- se dejó el archivo por si
// hace falta retomarlo, pero "folleto" NO es una galería del Home. Un
// folleto es el anuncio a pantalla completa que se ve al entrar al sitio
// (mismo splash de bienvenida que un banner clásico, con prioridad sobre
// él) -- ver WelcomeSplash.tsx, que es donde realmente se consume
// bannerService.getActivos("folleto") hoy.
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
