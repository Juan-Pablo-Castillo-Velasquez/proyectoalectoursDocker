import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

export default function PromoBar() {
    // Cuenta regresiva de la oferta. Cambia el valor inicial si necesitas otra duración.
    const [seconds, setSeconds] = useState(2 * 3600 + 18 * 60 + 46);

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

    return (
        <div
            className="h-[38px] flex items-center justify-center gap-3 sm:gap-6 px-4 text-white text-[11px] font-semibold text-center"
            style={{
                background: "linear-gradient(90deg, #581127, #7B1E3A, #65112e)",
            }}
        >
            <span className="flex items-center gap-1.5 text-[#C9A227]">
                <Sparkles className="w-3 h-3" />
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