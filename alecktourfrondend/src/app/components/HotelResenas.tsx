import { Star, User } from "lucide-react";
import { useEffect, useState } from "react";
import { ResenaResponse, resenaService } from "../services/resena.service";

export default function HotelResenas({ idHotel }: { idHotel: number }) {
  const [resenas, setResenas] = useState<ResenaResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    resenaService
      .getByHotel(idHotel)
      .then(setResenas)
      .catch(() => setResenas([]))
      .finally(() => setLoading(false));
  }, [idHotel]);

  if (loading || resenas.length === 0) return null;

  const promedio =
    resenas.reduce((acc, r) => acc + r.calificacion, 0) / resenas.length;

  return (
    <div className="mt-10 pt-10 border-t border-border">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-xl font-bold text-foreground">
          Opiniones de viajeros
        </h2>
        <span className="flex items-center gap-1 text-sm font-semibold text-foreground">
          <Star className="w-4 h-4 fill-[var(--chart-2)] text-[var(--chart-2)]" />
          {promedio.toFixed(1)} · {resenas.length}{" "}
          {resenas.length === 1 ? "reseña" : "reseñas"}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {resenas.map((r) => (
          <div
            key={r.id_resena}
            className="border border-border rounded-2xl p-4 bg-card"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <User className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {r.nombre_cliente ?? "Viajero AlecTours"}
                </p>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      className={`w-3 h-3 ${n <= r.calificacion ? "fill-[var(--chart-2)] text-[var(--chart-2)]" : "fill-muted text-muted"}`}
                    />
                  ))}
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {r.comentario}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
