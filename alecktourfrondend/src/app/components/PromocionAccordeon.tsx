import { Loader2, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Banner, bannerService, resolveImagenBanner } from "../services/banner.service";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "./ui/accordion";

const FACETAS: { valor: string; titulo: string; texto: string }[] = [
  {
    valor: "para-quien",
    titulo: "Para quién es",
    texto:
      "Válida para nuevos clientes y para quienes ya viajan con nosotros. Aplica a reservas de paquetes, hoteles y experiencias turísticas.",
  },
  {
    valor: "medios-pago",
    titulo: "Medios de pago",
    texto:
      "Paga con tarjeta de crédito o débito en cuotas, o por transferencia y efectivo en oficina. Consulta promociones bancarias del mes.",
  },
  {
    valor: "vigencia",
    titulo: "Vigencia",
    texto:
      "Aplica hasta agotar existencias y según las fechas indicadas en cada oferta. No acumulable con otros descuentos.",
  },
  {
    valor: "como-reclamar",
    titulo: "Cómo reclamarla",
    texto:
      "Reserva desde el catálogo o menciónala con tu asesor. Al confirmar, el descuento se aplica automáticamente al total.",
  },
];

export default function PromocionAccordeon() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let activo = true;
    bannerService
      .getActivos()
      .then((data) => { if (activo) setBanners(data); })
      .catch((err) => console.error("Error cargando promociones:", err))
      .finally(() => { if (activo) setLoading(false); });
    return () => { activo = false; };
  }, []);

  if (loading) {
    return (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-center text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      </section>
    );
  }

  if (banners.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
      <div className="flex items-center gap-2 mb-6">
        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/15 text-primary text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5" />
          VENTAJAS DE LA OFERTA
        </span>
      </div>

      <div className="space-y-6">
        {banners.map((banner) => (
          <div
            key={banner.id_banner}
            className="grid md:grid-cols-2 overflow-hidden rounded-2xl border border-border shadow-lg bg-card"
          >
            <div className="relative min-h-[220px] h-full">
              <img
                src={resolveImagenBanner(banner.imagen_url)}
                alt={banner.titulo}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-black/10" />
              <div className="absolute bottom-4 left-4 right-4 md:hidden text-white">
                <h3 className="text-lg font-bold" style={{ fontFamily: "'Fraunces', serif" }}>
                  {banner.titulo}
                </h3>
                {banner.descripcion_corta && (
                  <p className="text-white/80 text-sm mt-0.5">{banner.descripcion_corta}</p>
                )}
              </div>
            </div>

            <div className="p-6 md:p-8 flex flex-col justify-center">
              <div className="hidden md:block mb-4">
                <h3 className="text-xl font-bold text-foreground" style={{ fontFamily: "'Fraunces', serif" }}>
                  {banner.titulo}
                </h3>
                {banner.descripcion_corta && (
                  <p className="text-sm text-muted-foreground mt-1">{banner.descripcion_corta}</p>
                )}
              </div>

              <Accordion type="multiple" className="w-full">
                {FACETAS.map((f) => (
                  <AccordionItem key={f.valor} value={f.valor}>
                    <AccordionTrigger className="text-foreground">
                      {f.titulo}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {f.texto}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>

              {banner.texto_boton && (
                <Link
                  to={banner.link_destino ?? "/search"}
                  className="mt-5 inline-flex items-center justify-center px-5 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:opacity-95 transition-all shadow-sm w-full"
                >
                  {banner.texto_boton}
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
