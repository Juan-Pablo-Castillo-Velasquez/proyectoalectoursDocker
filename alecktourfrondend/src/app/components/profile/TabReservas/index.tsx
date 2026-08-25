import { Calendar, Loader2, Plane, Search } from "lucide-react";
import { AnimatePresence } from "motion/react";
import { useMemo, useState } from "react";
import { Link } from "react-router";
import { ClienteResponse } from "../../../services/cliente.service";
import CalendarioViaje from "./CalendarioViaje";
import { FiltroEstado } from "./constants";
import FiltroBar from "./FiltroBar";
import MetricasResumen from "./MetricasResumen";
import ModalCancelacion from "./ModalCancelacion";
import ModalResena from "./ModalResena";
import ReservaCard from "./ReservaCard";
import SectionHeader from "./SectionHeader";
import { fmt, getEstadoViaje, parseFechaLocal } from "./utils";

interface Props {
  reservas: any[];
  loading: boolean;
  reservaExpandida: number | null;
  setReservaExpandida: (id: number | null) => void;
  clienteData: ClienteResponse | null;
}

export default function TabReservas({
  reservas,
  loading,
  reservaExpandida,
  setReservaExpandida,
  clienteData,
}: Props) {
  const [modalReserva, setModalReserva] = useState<any | null>(null);
  const [modalResena, setModalResena] = useState<any | null>(null);
  const [solicitadas, setSolicitadas] = useState<Record<number, string>>({});
  const [filtro, setFiltro] = useState<FiltroEstado>("todas");
  const [busqueda, setBusqueda] = useState("");

  const handleCancelacionConfirmada = (id: number, motivo: string) =>
    setSolicitadas((prev) => ({ ...prev, [id]: motivo }));

  const hoy = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // "proxima" ahora incluye viajes que ya empezaron pero no han terminado
  // (antes se descartaban en cuanto pasaba el check-in).
  const proxima = useMemo(
    () =>
      reservas
        .filter(
          (r) =>
            r.estado !== "cancelada" &&
            parseFechaLocal(r.fecha_fin).getTime() >= hoy.getTime(),
        )
        .sort(
          (a, b) =>
            parseFechaLocal(a.fecha_inicio).getTime() -
            parseFechaLocal(b.fecha_inicio).getTime(),
        )[0],
    [reservas, hoy],
  );

  const diasRestantes = proxima
    ? Math.ceil(
        (parseFechaLocal(proxima.fecha_inicio).getTime() - hoy.getTime()) /
          86400000,
      )
    : null;

  const estadoViajeProxima = proxima
    ? getEstadoViaje(proxima.fecha_inicio, proxima.fecha_fin, hoy)
    : null;
  console.log("fecha_inicio raw:", proxima?.fecha_inicio, "| hoy:", hoy);

  const counts: Record<FiltroEstado, number> = useMemo(
    () => ({
      todas: reservas.length,
      confirmada: reservas.filter((r) => r.estado === "confirmada").length,
      pendiente: reservas.filter((r) => r.estado === "pendiente").length,
      finalizada: reservas.filter((r) => r.estado === "finalizada").length,
      cancelada: reservas.filter((r) => r.estado === "cancelada").length,
    }),
    [reservas],
  );

  const reservasFiltradas = useMemo(() => {
    let lista =
      filtro === "todas"
        ? reservas
        : reservas.filter((r) => r.estado === filtro);
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      lista = lista.filter(
        (r) =>
          String(r.id_reserva).includes(q) ||
          String(r.id_paquete).includes(q) ||
          fmt(r.fecha_inicio).toLowerCase().includes(q) ||
          fmt(r.fecha_fin).toLowerCase().includes(q),
      );
    }
    return lista;
  }, [reservas, filtro, busqueda]);

  return (
    <>
      <AnimatePresence>
        {modalReserva && (
          <ModalCancelacion
            reserva={modalReserva}
            onClose={() => setModalReserva(null)}
            onConfirm={handleCancelacionConfirmada}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modalResena && (
          <ModalResena
            reserva={modalResena}
            onClose={() => setModalResena(null)}
          />
        )}
      </AnimatePresence>

      {/* Header General */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight text-white">
          Mis Reservas
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Monitorea y gestiona el estado de tus itinerarios contratados
        </p>
      </div>

      {loading ? (
        <div className="bg-card text-card-foreground border border-border rounded-xl p-12 text-center shadow-sm">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            Sincronizando tus itinerarios...
          </p>
        </div>
      ) : reservas.length === 0 ? (
        <div className="bg-card text-card-foreground border border-border rounded-xl p-12 text-center shadow-sm">
          <Plane className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-foreground tracking-tight">
            Aún no registras reservas
          </h3>
          <p className="text-sm text-muted-foreground mb-5 max-w-xs mx-auto">
            Tus paquetes adquiridos aparecerán reflejados en esta sección para
            su gestión.
          </p>
          <Link
            to="/search"
            className="inline-block px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-95 transition-all shadow-sm"
          >
            Explorar Catálogo
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          <MetricasResumen counts={counts} />

          {proxima && diasRestantes !== null && estadoViajeProxima && (
            <section>
              <SectionHeader
                title="Cronograma más cercano"
                subtitle="Control de tiempo real para tu próximo servicio"
                icon={Plane}
              />
              <CalendarioViaje
                proxima={proxima}
                diasRestantes={diasRestantes}
                estadoViaje={estadoViajeProxima}
              />
            </section>
          )}

          <section>
            <SectionHeader
              title="Historial de Reservas"
              subtitle={`${counts.todas} solicitud${counts.todas !== 1 ? "es" : ""} registrada${counts.todas !== 1 ? "as" : ""}`}
              icon={Calendar}
            />

            {/* Con pocas reservas, el buscador y los filtros son ruido:
                solo se muestran cuando aportan valor real de filtrado. */}
            {reservas.length >= 3 && (
              <FiltroBar
                filtro={filtro}
                setFiltro={setFiltro}
                busqueda={busqueda}
                setBusqueda={setBusqueda}
                counts={counts}
              />
            )}

            {reservasFiltradas.length === 0 ? (
              <div className="bg-card text-card-foreground border border-border rounded-xl p-8 text-center">
                <Search className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm font-semibold text-muted-foreground">
                  No se encontraron resultados coincidentes
                </p>
                <p className="text-xs text-muted-foreground/60 mt-0.5">
                  Prueba reajustando los criterios de búsqueda o filtros.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {reservasFiltradas.map((reserva) => (
                    <ReservaCard
                      key={reserva.id_reserva}
                      reserva={reserva}
                      expanded={reservaExpandida === reserva.id_reserva}
                      onToggleExpand={() =>
                        setReservaExpandida(
                          reservaExpandida === reserva.id_reserva
                            ? null
                            : reserva.id_reserva,
                        )
                      }
                      clienteData={clienteData}
                      solicitudMotivo={solicitadas[reserva.id_reserva]}
                      onSolicitarCancelacion={() => setModalReserva(reserva)}
                      onDejarResena={() => setModalResena(reserva)}
                      hoy={hoy}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </section>
        </div>
      )}
    </>
  );
}