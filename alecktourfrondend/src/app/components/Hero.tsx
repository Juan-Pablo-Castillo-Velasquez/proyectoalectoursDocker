import { Compass, PlayCircle } from "lucide-react";
import { motion } from "motion/react";
import SearchBar from "./SearchBar";

const stats = [
  { value: "180K+", label: "viajeros" },
  { value: "4.8/5", label: "satisfacción" },
  { value: "24/7", label: "asistencia" },
  { value: "★", label: "mejor precio" },
];

const avatarImages = [
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=100&q=80",
];

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-background transition-colors duration-300">
      {/* Fondo */}
      <div className="absolute inset-0 z-0">
        <motion.img
          src="https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=2400&auto=format&fit=crop"
          alt="Destino de viaje"
          initial={{ scale: 1.08 }}
          animate={{ scale: 1 }}
          transition={{
            duration: 2,
            ease: [0.25, 1, 0.5, 1],
          }}
          className="w-full h-full object-cover select-none pointer-events-none"
        />

        {/* Degradado adaptable a tu tema (claro/oscuro) en lugar del estilo quemado */}
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/30 backdrop-blur-[2px]" />

        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[var(--chart-2)]/40 to-transparent" />
      </div>

      {/* Contenido principal */}
      <div
        className="
                    relative z-10
                    max-w-[1450px]
                    mx-auto
                    px-4 sm:px-6 lg:px-10
                    pt-16 pb-20
                    md:pt-20 md:pb-24
                    grid grid-cols-1
                    lg:grid-cols-[minmax(0,1fr)_760px]
                    gap-10 lg:gap-16
                    items-center
                "
      >
        {/* =========================
                    CONTENIDO IZQUIERDO
                ========================== */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.8,
            ease: [0.25, 1, 0.5, 1],
          }}
        >
          {/* Badge */}
          <div
            className="
                            inline-flex
                            items-center
                            gap-2
                            mb-5
                            px-3
                            py-1.5
                            rounded-full
                            border
                            border-border
                            bg-background/50
                            backdrop-blur-md
                        "
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--chart-2)]" />

            <span
              className="
                                text-[var(--chart-2)]
                                text-[10px]
                                font-bold
                                tracking-[0.2em]
                                uppercase
                            "
            >
              Tarifas exclusivas para Colombia
            </span>
          </div>

          {/* Título */}
          <h1
            className="
                            text-foreground
                            text-4xl
                            sm:text-5xl
                            md:text-[54px]
                            font-normal
                            leading-[1.05]
                            mb-5
                            tracking-tight
                            max-w-xl
                        "
            style={{
              fontFamily: "'Fraunces', serif",
            }}
          >
            Tu próximo viaje
            <br />
            empieza <span className="italic text-[var(--chart-2)]">aquí.</span>
          </h1>

          {/* Descripción */}
          <p
            className="
                            text-muted-foreground
                            text-sm
                            sm:text-[15px]
                            max-w-md
                            leading-relaxed
                            font-light
                            mb-7
                        "
          >
            Compara vuelos, hoteles y experiencias en un solo lugar. Encuentra
            destinos increíbles con precios transparentes y acompañamiento real.
          </p>

          {/* Botones */}
          <div className="flex flex-wrap gap-3 mb-8">
            <a
              href="/search"
              className="
                                inline-flex
                                items-center
                                gap-2
                                px-5
                                py-3
                                rounded-xl
                                bg-primary
                                text-primary-foreground
                                text-[13px]
                                font-bold
                                hover:-translate-y-0.5
                                transition-transform
                                shadow-lg
                                shadow-primary/30
                            "
            >
              <Compass className="w-4 h-4" />
              Explorar destinos
            </a>

            <a
              href="#como-funciona"
              className="
                                inline-flex
                                items-center
                                gap-2
                                px-5
                                py-3
                                rounded-xl
                                border
                                border-border
                                bg-background/50
                                backdrop-blur-md
                                text-foreground
                                text-[13px]
                                font-bold
                                hover:bg-accent
                                hover:text-accent-foreground
                                transition-colors
                            "
            >
              <PlayCircle className="w-4 h-4" />
              Cómo funciona
            </a>
          </div>

          {/* Viajeros */}
          <div className="flex items-center gap-3">
            <div className="flex">
              {avatarImages.map((src, i) => (
                <div
                  key={i}
                  className="
                                        w-8
                                        h-8
                                        rounded-full
                                        border-2
                                        border-background
                                        bg-cover
                                        bg-center
                                        -ml-2
                                        first:ml-0
                                    "
                  style={{
                    backgroundImage: `url(${src})`,
                  }}
                />
              ))}
            </div>

            <p className="text-[11px] text-muted-foreground leading-tight">
              <b className="text-foreground">+180.000 viajeros</b>
              <br />
              ya viajaron con nosotros
            </p>
          </div>
        </motion.div>

        {/* =========================
                    BUSCADOR
                ========================== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.8,
            delay: 0.15,
            ease: [0.25, 1, 0.5, 1],
          }}
          className="
                        w-full
                        lg:max-w-[760px]
                        lg:justify-self-end
                    "
        >
          <SearchBar />
        </motion.div>
      </div>

      {/* =========================
                STATS
            ========================== */}
      <div
        className="
                    hidden
                    lg:flex
                    absolute
                    right-4
                    sm:right-6
                    lg:right-8
                    bottom-6
                    gap-2
                    z-10
                "
      >
        {stats.map((s) => (
          <div
            key={s.label}
            className="
                            min-w-[76px]
                            px-3
                            py-2.5
                            rounded-[9px]
                            border
                            border-border
                            bg-background/60
                            backdrop-blur-md
                        "
          >
            <strong className="block text-foreground text-sm">{s.value}</strong>

            <span
              className="
                                text-muted-foreground
                                text-[8px]
                                uppercase
                                tracking-wide
                            "
            >
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
