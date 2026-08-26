import {
  Calendar,
  MapPin,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router";
import { destinoService, DestinoSugerencia } from "../services/destino.service";

interface MenuRect {
  top: number;
  left: number;
  width: number;
}

export default function SearchBar() {
  const navigate = useNavigate();
  const destinoWrapperRef = useRef<HTMLDivElement>(null);

  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [people, setPeople] = useState("1");
  const [showDestinations, setShowDestinations] = useState(false);
  const [filteredDestinations, setFilteredDestinations] = useState<DestinoSugerencia[]>([]);
  // Posición del dropdown calculada en coordenadas de viewport, para
  // renderizarlo con un portal (ver comentario más abajo) en vez de dejarlo
  // anidado dentro de la barra.
  const [menuRect, setMenuRect] = useState<MenuRect | null>(null);

  // Precarga destinos disponibles apenas se monta la barra (sin esperar a
  // que el usuario haga foco ni escriba) — así el dropdown ya tiene datos
  // reales listos para mostrarse "automáticamente" en cuanto se abre.
  useEffect(() => {
    destinoService
      .getSugerencias("", 8)
      .then(setFilteredDestinations)
      .catch(() => setFilteredDestinations([]));
  }, []);

  // Autocompletado real contra la base de datos (con debounce para no
  // disparar una petición en cada tecla). Con destination vacío el backend
  // ya devuelve destinos reales (no filtra), así que el dropdown muestra
  // opciones disponibles incluso antes de escribir.
  useEffect(() => {
    if (!showDestinations) return;
    const timeout = setTimeout(() => {
      destinoService
        .getSugerencias(destination.trim(), 8)
        .then(setFilteredDestinations)
        .catch(() => setFilteredDestinations([]));
    }, 250);
    return () => clearTimeout(timeout);
  }, [destination, showDestinations]);

  // El dropdown se renderiza con un portal directo a <body> (ver el bloque
  // de sugerencias más abajo) porque la barra vive dentro del Hero, cuyo
  // fondo (foto/video) necesita "overflow-hidden" y crea un contexto de
  // apilamiento propio: cualquier sección normal que venga después en el
  // HTML (ej. "Benefits") termina pintándose ENCIMA de un dropdown
  // absolute que se sale de esa caja, aunque tenga z-index alto — es una
  // limitación real de CSS (contextos de apilamiento), no algo que se
  // arregle subiendo el z-index dentro del Hero. Un portal a <body> saca
  // el dropdown de esa jerarquía por completo. Como usa position:fixed,
  // hay que recalcular su posición en cada apertura y si la página hace
  // scroll o cambia de tamaño mientras está abierto.
  useEffect(() => {
    if (!showDestinations) return;

    const actualizarPosicion = () => {
      const rect = destinoWrapperRef.current?.getBoundingClientRect();
      if (!rect) return;
      setMenuRect({ top: rect.bottom + 6, left: rect.left, width: rect.width });
    };

    actualizarPosicion();
    window.addEventListener("scroll", actualizarPosicion, true);
    window.addEventListener("resize", actualizarPosicion);
    return () => {
      window.removeEventListener("scroll", actualizarPosicion, true);
      window.removeEventListener("resize", actualizarPosicion);
    };
  }, [showDestinations]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    if (!destination.trim()) return;

    const params = new URLSearchParams({
      destination: destination.trim(),
      start: startDate,
      end: endDate,
      people,
    });

    navigate(`/search?${params.toString()}`);
  };

  const selectDestination = (value: string) => {
    setDestination(value);
    setShowDestinations(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: 0.25,
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="w-full"
    >
      {/* Encabezado, breve — la barra habla por sí sola */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <span
          className="text-white text-[15px]"
          style={{ fontFamily: "'Fraunces', serif", fontWeight: 600 }}
        >
          Encuentra tu próximo hotel
        </span>
        <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-300">
          <ShieldCheck className="w-3.5 h-3.5" />
          Reserva segura
        </span>
      </div>

      <form
        onSubmit={handleSearch}
        className="bg-white rounded-2xl sm:rounded-full w-full text-[#2E2E2E] relative border border-[#7B1E3A]/10 flex flex-col sm:flex-row items-stretch divide-y sm:divide-y-0 sm:divide-x divide-gray-200/80"
        style={{
          boxShadow:
            "0 24px 60px -16px rgba(123, 30, 58, 0.32), 0 4px 16px rgba(0,0,0,0.04)",
        }}
      >
        {/* DESTINO */}
        <div ref={destinoWrapperRef} className="relative flex-[1.3] min-w-0">
          <Segment label="Destino" icon={MapPin}>
            <input
              type="text"
              value={destination}
              onFocus={() => setShowDestinations(true)}
              onBlur={() => {
                // Pequeño delay para que el click en una sugerencia
                // (selectDestination) alcance a registrarse antes de cerrar.
                setTimeout(() => setShowDestinations(false), 150);
              }}
              onChange={(e) => {
                setDestination(e.target.value);
                setShowDestinations(true);
              }}
              placeholder="¿A qué ciudad viajas?"
              required
              autoComplete="off"
              className="w-full bg-transparent text-[13px] font-semibold outline-none truncate placeholder:text-[#b9adb2] placeholder:font-normal"
            />
          </Segment>
        </div>

        {/* ENTRADA */}
        <div className="flex-1 min-w-0">
          <Segment label="Entrada" icon={Calendar}>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              className="w-full bg-transparent text-[13px] font-semibold outline-none"
            />
          </Segment>
        </div>

        {/* SALIDA */}
        <div className="flex-1 min-w-0">
          <Segment label="Salida" icon={Calendar}>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
              className="w-full bg-transparent text-[13px] font-semibold outline-none"
            />
          </Segment>
        </div>

        {/* HUÉSPEDES */}
        <div className="flex-1 min-w-0">
          <Segment label="Huéspedes" icon={Users}>
            <select
              value={people}
              onChange={(e) => setPeople(e.target.value)}
              className="w-full bg-transparent text-[13px] font-semibold outline-none appearance-none cursor-pointer"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                <option key={num} value={num}>
                  {num} {num === 1 ? "huésped" : "huéspedes"}
                </option>
              ))}
            </select>
          </Segment>
        </div>

        {/* BUSCAR */}
        <motion.button
          whileHover={{ scale: 1.015 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          className="m-1.5 sm:m-1.5 rounded-xl sm:rounded-full bg-[#7B1E3A] text-white text-[13px] font-bold flex items-center justify-center gap-2 py-3.5 sm:py-0 sm:px-7 shrink-0"
          style={{
            boxShadow: "0 8px 20px -6px rgba(123, 30, 58, 0.45)",
          }}
        >
          <Search className="w-4 h-4" />
          Buscar hoteles
        </motion.button>
      </form>

      <div className="flex items-center justify-center sm:justify-end pt-2 px-1">
        <span className="flex items-center gap-1.5 text-[11px] text-white/80">
          <ShieldCheck className="w-3.5 h-3.5" />
          Pagos seguros
        </span>
      </div>

      {/* SUGERENCIAS — portal a <body> (ver comentario junto al useEffect
          de arriba); position:fixed con coordenadas de viewport calculadas
          desde el propio input, así nunca queda recortado ni tapado por
          las secciones que vienen después del Hero. */}
      {createPortal(
        <AnimatePresence>
            {showDestinations && menuRect && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.16 }}
                style={{
                  position: "fixed",
                  top: menuRect.top,
                  left: menuRect.left,
                  width: menuRect.width,
                }}
                className="z-[10000] bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden min-w-[240px]"
              >
                <div className="px-3 py-2.5 border-b border-gray-100">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400">
                    {destination.trim() ? "Destinos disponibles" : "Destinos populares"}
                  </p>
                </div>

                {filteredDestinations.length > 0 ? (
                  <div className="py-1.5">
                    {filteredDestinations.map((item) => (
                      <button
                        key={item.id_destino}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => selectDestination(item.nombre_destino)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-[#7B1E3A]/5 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-lg bg-[#7B1E3A]/8 flex items-center justify-center shrink-0">
                          <MapPin className="w-3.5 h-3.5 text-[#7B1E3A]" />
                        </div>

                        <div className="min-w-0">
                          <p className="text-[12px] font-bold text-gray-800 truncate">
                            {item.nombre_destino}
                          </p>

                          <p className="text-[10px] text-gray-400">
                            {[item.ciudad, item.pais].filter(Boolean).join(" · ")}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-5 text-center">
                    <MapPin className="w-5 h-5 text-gray-300 mx-auto mb-2" />

                    <p className="text-xs font-semibold text-gray-600">
                      Buscaremos este destino
                    </p>

                    <p className="text-[10px] text-gray-400 mt-1">
                      Presiona Buscar para consultar los alojamientos.
                    </p>
                  </div>
                )}

                <div className="px-3 py-2 border-t border-gray-100 bg-gray-50">
                  <p className="text-[9px] text-gray-400">
                    Escribe una ciudad o país para encontrar hoteles.
                  </p>
                </div>
              </motion.div>
            )}
        </AnimatePresence>,
        document.body
      )}
    </motion.div>
  );
}

function Segment({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="px-5 py-3 h-full flex flex-col justify-center min-w-0">
      <label className="flex items-center gap-1 text-[9px] uppercase tracking-wide font-bold text-[#9d8e94] mb-1">
        <Icon className="w-2.5 h-2.5 text-[#7B1E3A]" />
        {label}
      </label>

      {children}
    </div>
  );
}
