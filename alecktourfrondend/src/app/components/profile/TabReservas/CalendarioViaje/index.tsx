import { EstadoViaje, nights, parseFechaLocal } from "../utils";
import CalendarioGrid from "./CalendarioGrid";
import HeaderResumen from "./HeaderResumen";
import StatsResumen from "./StatsResumen";
import UrgenciaBadge from "./UrgenciaBadge";

interface Props {
  proxima: any;
  diasRestantes: number;
  estadoViaje: EstadoViaje;
}

export default function CalendarioViaje({
  proxima,
  diasRestantes,
  estadoViaje,
}: Props) {
  const ini = parseFechaLocal(proxima.fecha_inicio);
  const fin = parseFechaLocal(proxima.fecha_fin);
  const year = ini.getFullYear();
  const month = ini.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const checkIn = ini.getDate();
  const checkOut = fin.getDate();
  const monthName = ini.toLocaleDateString("es-CO", {
    month: "long",
    year: "numeric",
  });
  const noches = nights(proxima.fecha_inicio, proxima.fecha_fin);
  const ahora = new Date();
  const hoyDia = ahora.getDate();
  const hoyMes = ahora.getMonth();
  const esEsteMes = hoyMes === month;

  return (
    <div className="bg-card text-card-foreground border border-border rounded-xl shadow-md overflow-hidden transition-colors duration-200">
      <HeaderResumen
        proxima={proxima}
        diasRestantes={diasRestantes}
        noches={noches}
        estadoViaje={estadoViaje}
      />

      <UrgenciaBadge diasRestantes={diasRestantes} estadoViaje={estadoViaje} />

      <div className="p-5">
        <CalendarioGrid
          monthName={monthName}
          firstDay={firstDay}
          daysInMonth={daysInMonth}
          checkIn={checkIn}
          checkOut={checkOut}
          esEsteMes={esEsteMes}
          hoyDia={hoyDia}
        />

        <StatsResumen
          proxima={proxima}
          diasRestantes={diasRestantes}
          noches={noches}
          estadoViaje={estadoViaje}
        />
      </div>
    </div>
  );
}