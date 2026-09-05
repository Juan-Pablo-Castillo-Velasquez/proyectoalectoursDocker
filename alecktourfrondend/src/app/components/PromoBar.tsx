import { useEffect, useState } from "react";
import { useTema } from "../context/TemaContext";
import { resolveImagenTema } from "../services/tema.service";
import { getTemaIcono } from "../utils/temaIconos";

export default function PromoBar() {
    // Cuenta regresiva de la oferta. Cambia el valor inicial si necesitas otra duración.
    const [seconds, setSeconds] = useState(2 * 3600 + 18 * 60 + 46);
    const { temaActivo } = useTema();

    useEffect(() => {
        const timer = setInterval(() => {
            setSeconds((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const format = (value: number) => String(value).padStart(2, "0");
    const h = format(Math.floor(seconds / 3600));
    const m = format(Math.floor((seconds % 3600) / 60));
    const s = format(seconds % 60);

    // Ícono decorativo del tema de temporada activo (Halloween, Navidad,
    // Amor y Amistad...) -- Sparkles por defecto con el tema "Marca". El
    // fondo usa los mismos tokens derivados de --primary que ya usa
    // .footer-brand (theme.css), así que se recolorea solo con el tema
    // activo sin tocar nada aquí cuando el admin activa otro.
    const IconoTema = getTemaIcono(temaActivo?.icono);
    // Imagen real decorativa del tema activo (ej. calabazas de Halloween,
    // un árbol de Navidad) -- opcional, subida por el admin en
    // ModuleTemas.tsx. Sin imagen, la barra queda igual que siempre, solo
    // con el ícono lucide.
    const imagenTema = temaActivo?.imagen_url ? resolveImagenTema(temaActivo.imagen_url) : null;

    return (
        <div
            className="h-[38px] flex items-center justify-center gap-3 sm:gap-6 px-4 text-white text-[11px] font-semibold text-center"
            style={{
                background:
                    "linear-gradient(90deg, var(--primary-deep-2) 0%, var(--primary-shade) 50%, var(--primary-deep) 100%)",
            }}
        >
            {imagenTema && (
                <img
                    src={imagenTema}
                    alt=""
                    className="hidden sm:block h-6 w-6 rounded-full object-cover border border-white/40 shrink-0"
                />
            )}

            <span className="flex items-center gap-1.5" style={{ color: "var(--gold-surface)" }}>
                <IconoTema className="w-3 h-3" />
                OFERTA ESPECIAL
            </span>

            <span className="hidden sm:inline text-white/90">
                Hasta 30% OFF en paquetes seleccionados
            </span>

            <span className="px-2.5 py-1 rounded-md border border-white/25 bg-white/10 tracking-wide">
                Código: VIAJA30
            </span>

            <span className="hidden md:inline text-white/70 font-normal">
                Oferta por tiempo limitado ·{" "}
                <b className="text-white font-semibold">
                    {h}:{m}:{s}
                </b>
            </span>
        </div>
    );
}
