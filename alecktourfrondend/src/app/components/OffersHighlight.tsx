import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { OfertaDestacada, promocionService } from "../services/promocion.service";

export default function OffersHighlight() {
    const [offers, setOffers] = useState<OfertaDestacada[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let activo = true;

        promocionService
            .getDestacados()
            .then((data) => {
                if (activo) setOffers(data);
            })
            .catch((err) => {
                console.error("Error cargando ofertas destacadas:", err);
            })
            .finally(() => {
                if (activo) setLoading(false);
            });

        return () => {
            activo = false;
        };
    }, []);

    // No renderizamos la sección si no hay ofertas (evita un bloque vacío feo)
    if (!loading && offers.length === 0) return null;

    return (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 bg-background transition-colors duration-300">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-8 gap-3">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="h-px w-8 bg-[var(--chart-2)]" />
                        <span className="text-primary text-[11px] font-bold uppercase tracking-[0.2em]">
                            Ofertas destacadas
                        </span>
                    </div>
                    <h2
                        className="text-2xl md:text-3xl text-foreground font-medium"
                        style={{ fontFamily: "'Fraunces', serif" }}
                    >
                        Viaja más, paga menos
                    </h2>
                </div>
                <Link
                    to="/search"
                    className="flex items-center gap-1.5 text-primary text-sm font-semibold hover:gap-2.5 hover:text-primary/80 transition-all"
                >
                    Ver todas las ofertas
                    <ArrowRight className="w-4 h-4" />
                </Link>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {[0, 1, 2].map((i) => (
                        <div
                            key={i}
                            className="h-64 rounded-2xl bg-muted animate-pulse"
                        />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {offers.map((o, i) => (
                        <motion.div
                            key={o.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-60px" }}
                            transition={{ delay: i * 0.1, duration: 0.5 }}
                        >
                            <Link
                                to={`/hotel/${o.id}`}
                                className="group relative h-64 rounded-2xl overflow-hidden cursor-pointer block"
                            >
                                <img
                                    src={o.img}
                                    alt={o.title}
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />

                                <span className="absolute top-4 left-4 px-2.5 py-1 rounded-md bg-[var(--chart-2)] text-[#513b12] text-[11px] font-black shadow-sm">
                                    {o.discount}
                                </span>

                                <div className="absolute bottom-4 left-4 right-4 text-white">
                                    <h3
                                        className="text-lg mb-0.5 font-bold"
                                        style={{ fontFamily: "'Fraunces', serif" }}
                                    >
                                        {o.title}
                                    </h3>
                                    <p className="text-white/75 text-xs mb-2">{o.tag}</p>
                                    <p className="text-sm">
                                        Desde <b className="text-[var(--chart-2)]">${o.price}</b>
                                        {o.oldPrice && (
                                            <span className="line-through text-white/50 text-xs ml-2">
                                                ${o.oldPrice}
                                            </span>
                                        )}
                                    </p>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            )}
        </section>
    );
}