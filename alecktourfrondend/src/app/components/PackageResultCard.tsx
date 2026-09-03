import { ArrowRight, Clock, MapPin, Package as PackageIcon } from "lucide-react";
import { motion } from "motion/react";
import { Link } from "react-router";
import { PaqueteResponse } from "../services/paquete.service";

interface PackageResultCardProps {
  pkg: PaqueteResponse;
  index?: number;
}

// La API no guarda foto para paquetes, así que usamos el mismo pool de fotos
// reales por ciudad que ya usa PackageDetail.tsx (nunca inventamos una URL
// de imagen que "parezca" pertenecer al paquete).
const CITY_IMAGES: Record<string, string> = {
  cartagena: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
  "santa marta": "https://images.unsplash.com/photo-1596402184320-417e7178b2cd?w=800&q=80",
  medellín: "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=800&q=80",
  medellin: "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=800&q=80",
  bogotá: "https://images.unsplash.com/photo-1605723517503-3cadb5818a0c?w=800&q=80",
  bogota: "https://images.unsplash.com/photo-1605723517503-3cadb5818a0c?w=800&q=80",
  cali: "https://images.unsplash.com/photo-1531761535209-180857e963b9?w=800&q=80",
  salento: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800&q=80",
  "villa de leyva": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
  barranquilla: "https://images.unsplash.com/photo-1519451241324-20b4ea2c4220?w=800&q=80",
  "san andrés": "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80",
  "san andres": "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80",
};
const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80";

function getImage(ciudad?: string | null) {
  if (!ciudad) return DEFAULT_IMAGE;
  return CITY_IMAGES[ciudad.toLowerCase().trim()] ?? DEFAULT_IMAGE;
}

export default function PackageResultCard({ pkg, index = 0 }: PackageResultCardProps) {
  const imagen = getImage(pkg.ciudad_destino ?? pkg.ciudad_salida);
  const ruta =
    pkg.ciudad_salida && pkg.ciudad_destino && pkg.ciudad_salida !== pkg.ciudad_destino
      ? `${pkg.ciudad_salida} → ${pkg.ciudad_destino}`
      : (pkg.ciudad_destino ?? pkg.ciudad_salida ?? "Colombia");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      whileHover={{ y: -4, transition: { duration: 0.25 } }}
    >
      <Link
        to={`/package/${pkg.id_paquete}`}
        className="group block h-full overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-xl"
      >
        <div className="relative h-44 overflow-hidden bg-muted">
          <img
            src={imagen}
            alt={ruta}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).src = DEFAULT_IMAGE;
            }}
          />
          <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary shadow-sm backdrop-blur">
            <PackageIcon className="h-3 w-3" />
            Paquete
          </span>
        </div>

        <div className="p-4">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
            <span className="truncate">{ruta}</span>
          </div>

          <h3 className="mt-1 text-base font-bold leading-tight text-foreground group-hover:text-primary transition-colors">
            {pkg.nombre_paquete}
          </h3>

          {pkg.duracion_dias > 0 && (
            <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              {pkg.duracion_dias} {pkg.duracion_dias === 1 ? "día" : "días"}
            </div>
          )}

          <div className="mt-3 flex items-end justify-between border-t border-border pt-3">
            <div>
              <p className="text-[10px] text-muted-foreground">Desde · por persona</p>
              <p className="text-lg font-extrabold tracking-tight text-primary">
                ${pkg.precio_base.toLocaleString("es-CO")}
              </p>
            </div>
            <span className="flex items-center gap-1 text-xs font-bold text-primary transition-transform group-hover:translate-x-0.5">
              Ver paquete
              <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
