import { ChevronLeft, ChevronRight, MapPin, Package as PackageIcon, Search } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import PackageResultCard from "../components/PackageResultCard";
import { useSeoMeta } from "../hooks/useSeoMeta";
import { PaqueteResponse, paqueteService } from "../services/paquete.service";

type OrdenPor = "relevancia" | "precio_asc" | "precio_desc";

const RESULTADOS_POR_PAGINA = 9;

// Antes el link "Paquetes" del navbar llevaba a /search (la misma página de
// hoteles) -- esta es la página de catálogo real que le faltaba: paquetes
// reales (tablas paquetes/paquete_hotel/paquete_servicios, ver
// backend/app/routes/reserva_route.py) que ya tenían servicio, tipos y
// hasta una ficha de detalle (PackageDetail.tsx) construidos, pero a los
// que nada enlazaba.
export default function Packages() {
  const [paquetes, setPaquetes] = useState<PaqueteResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [ordenPor, setOrdenPor] = useState<OrdenPor>("relevancia");
  const [pagina, setPagina] = useState(1);

  useEffect(() => {
    setLoading(true);
    paqueteService
      .getAll(0, 300)
      .then(setPaquetes)
      .catch(() => setPaquetes([]))
      .finally(() => setLoading(false));
  }, []);

  useSeoMeta({
    title: "Paquetes de viaje",
    description:
      "Explora los paquetes de viaje de AleckTours: hotel, actividades y traslados combinados en un solo precio por persona.",
    path: "/packages",
  });

  const ordenados = [...paquetes].sort((a, b) => {
    if (ordenPor === "precio_asc") return a.precio_base - b.precio_base;
    if (ordenPor === "precio_desc") return b.precio_base - a.precio_base;
    return 0;
  });

  const totalPaginas = Math.max(1, Math.ceil(ordenados.length / RESULTADOS_POR_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas);
  const paginados = ordenados.slice(
    (paginaActual - 1) * RESULTADOS_POR_PAGINA,
    paginaActual * RESULTADOS_POR_PAGINA
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <PackageIcon className="w-4 h-4 text-primary" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              Paquetes de viaje
            </span>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl mb-2">
            Encuentra tu próximo paquete
          </h1>

          <p className="text-muted-foreground text-sm md:text-base font-medium">
            {loading
              ? "Buscando paquetes disponibles..."
              : `${ordenados.length} ${ordenados.length === 1 ? "paquete disponible" : "paquetes disponibles"}`}
          </p>
        </motion.div>

        {!loading && ordenados.length > 0 && (
          <div className="flex items-center justify-end gap-2 mb-4">
            <label htmlFor="ordenar-paquetes" className="text-xs font-medium text-muted-foreground">
              Ordenar por
            </label>
            <select
              id="ordenar-paquetes"
              value={ordenPor}
              onChange={(e) => {
                setOrdenPor(e.target.value as OrdenPor);
                setPagina(1);
              }}
              className="text-sm font-semibold bg-card border border-border rounded-lg px-3 py-1.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
            >
              <option value="relevancia">Más relevantes</option>
              <option value="precio_asc">Precio: menor a mayor</option>
              <option value="precio_desc">Precio: mayor a menor</option>
            </select>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="rounded-2xl border border-border bg-card overflow-hidden animate-pulse">
                <div className="h-44 bg-muted" />
                <div className="p-4 space-y-3">
                  <div className="h-3 w-1/2 bg-muted rounded" />
                  <div className="h-5 w-3/4 bg-muted rounded" />
                  <div className="h-8 w-full bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : ordenados.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {paginados.map((pkg, index) => (
                <PackageResultCard key={pkg.id_paquete} pkg={pkg} index={index} />
              ))}
            </div>

            {totalPaginas > 1 && (
              <nav
                aria-label="Paginación de paquetes"
                className="flex items-center justify-center gap-1.5 mt-8"
              >
                <button
                  type="button"
                  onClick={() => {
                    setPagina((n) => Math.max(1, n - 1));
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  disabled={paginaActual === 1}
                  aria-label="Página anterior"
                  className="h-9 w-9 flex items-center justify-center rounded-lg border border-border bg-card text-foreground disabled:opacity-40 disabled:cursor-not-allowed hover:border-primary/40 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => {
                      setPagina(n);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    aria-current={n === paginaActual ? "page" : undefined}
                    className={`h-9 min-w-9 px-2.5 flex items-center justify-center rounded-lg text-sm font-semibold transition-colors ${
                      n === paginaActual
                        ? "bg-primary text-primary-foreground"
                        : "border border-border bg-card text-foreground hover:border-primary/40"
                    }`}
                  >
                    {n}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => {
                    setPagina((n) => Math.min(totalPaginas, n + 1));
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  disabled={paginaActual === totalPaginas}
                  aria-label="Página siguiente"
                  className="h-9 w-9 flex items-center justify-center rounded-lg border border-border bg-card text-foreground disabled:opacity-40 disabled:cursor-not-allowed hover:border-primary/40 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </nav>
            )}
          </>
        ) : (
          <div className="bg-card rounded-2xl border border-border p-8 sm:p-12 text-center">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-muted mb-4">
              <Search className="h-6 w-6 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-bold text-foreground mb-1">
              Todavía no hay paquetes publicados
            </h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Estamos preparando nuevos paquetes de viaje. Mientras tanto, explora
              nuestros hoteles disponibles.
            </p>
            <Link
              to="/search"
              className="inline-flex items-center gap-1.5 mt-4 text-sm font-semibold text-primary hover:underline"
            >
              <MapPin className="h-4 w-4" />
              Ver hoteles
            </Link>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
