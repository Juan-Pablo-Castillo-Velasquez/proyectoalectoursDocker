import { ChevronLeft, ChevronRight, CreditCard, PhoneCall, Tag } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

const BANNERS = [
    "https://media.staticontent.com/media/pictures/eb180356-7ed8-4c55-bbc2-723dff25b428",
    "https://media.staticontent.com/media/pictures/a3a3fe8a-9b7b-4fab-8b7a-5a0c6417f08b",
    "https://media.staticontent.com/media/pictures/8d9b3f9a-cd45-459e-b46d-935145eef64c",
];

export default function QuickAccessCards() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [direction, setDirection] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            handleNext();
        }, 5000);
        return () => clearInterval(timer);
    }, [currentIndex]);

    const handleNext = () => {
        setDirection(1);
        setCurrentIndex((prev) => (prev + 1) % BANNERS.length);
    };

    const handlePrev = () => {
        setDirection(-1);
        setCurrentIndex((prev) => (prev - 1 + BANNERS.length) % BANNERS.length);
    };

    const slideVariants = {
        enter: (dir: number) => ({ x: dir > 0 ? 1200 : -1200, opacity: 0 }),
        center: { x: 0, opacity: 1 },
        exit: (dir: number) => ({ x: dir < 0 ? 1200 : -1200, opacity: 0 })
    };

    const cards = [
        {
            icon: <CreditCard className="w-5 h-5 text-[#7B1E3A]" />,
            title: "Promos y medios de pago",
            description: "Cuotas con tarjetas, promociones bancarias y mucho más.",
            link: "/informacion/promos-bancarias",
        },
        {
            icon: <Tag className="w-5 h-5 text-[#7B1E3A]" />,
            title: "Beneficios y cupones",
            description: "Acumula puntos Pasaporte y aprovecha todos los cupones.",
            link: "/beneficios",
        },
        {
            icon: <PhoneCall className="w-5 h-5 text-[#7B1E3A]" />,
            title: "Mi agente AlekTours",
            description: "Compra llamando al 01 800 518 9330 o en nuestros canales.",
            link: "/informacion/canales",
        },
    ];

    return (
        <section className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 mb-12">

            {/* PARTE 1: El Slider de Banners (VA ARRIBA) */}
            <div className="relative h-[180px] sm:h-[260px] md:h-[338px] w-full rounded-2xl overflow-hidden group shadow-md bg-[#160D12] z-10">
                <AnimatePresence initial={false} custom={direction}>
                    <motion.img
                        key={currentIndex}
                        src={BANNERS[currentIndex]}
                        custom={direction}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ x: { type: "spring", stiffness: 300, damping: 32 }, opacity: { duration: 0.2 } }}
                        className="absolute inset-0 w-full h-full object-cover select-none"
                        alt="Banner promocional"
                    />
                </AnimatePresence>

                {/* Flechas de Navegación laterales fijas estilo Despegar */}
                <button
                    onClick={handlePrev}
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-20 bg-white hover:bg-gray-100 text-gray-700 p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>

                <button
                    onClick={handleNext}
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-20 bg-white hover:bg-gray-100 text-gray-700 p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>

            {/* PARTE 2: Las Tarjetas Blancas (FLOTAN ENCIMA DEL BANNER) */}
            <div className="relative z-30 max-w-6xl mx-auto -mt-10 md:-mt-12 px-4 sm:px-6">
                <div className="bg-white rounded-xl p-5 md:p-6 shadow-[0_12px_30px_rgba(0,0,0,0.08)] border border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                    {cards.map((card, index) => (
                        <a
                            key={index}
                            href={card.link}
                            className={`flex items-start gap-4 p-2 transition-all duration-200 hover:translate-y-[-2px] group ${index > 0 ? "pt-5 md:pt-1 md:pl-6" : "md:pr-2"
                                }`}
                        >
                            <div className="p-3 bg-[#7B1E3A]/5 rounded-xl group-hover:bg-[#7B1E3A]/10 transition-colors shrink-0">
                                {card.icon}
                            </div>
                            <div className="text-left">
                                <h5 className="text-gray-900 font-medium text-sm md:text-base mb-1 group-hover:text-[#7B1E3A] transition-colors">
                                    {card.title}
                                </h5>
                                <p className="text-gray-500 text-xs md:text-sm font-light leading-relaxed">
                                    {card.description}
                                </p>
                            </div>
                        </a>
                    ))}
                </div>
            </div>

        </section>
    );
}