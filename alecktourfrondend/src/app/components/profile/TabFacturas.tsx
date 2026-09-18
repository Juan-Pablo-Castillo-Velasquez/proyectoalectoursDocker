import { Download, FileText, Receipt } from "lucide-react";
import { useMemo } from "react";
import { ClienteResponse } from "../../services/cliente.service";
import { PagoResponse } from "../../services/reserva.service";
import { ReservaResponse } from "../../data/reservaTypes";
import { generarFacturaPdf } from "../../utils/generarFacturaPdf";

interface Props {
  reservas: ReservaResponse[];
  clienteData: ClienteResponse | null;
}

interface FilaFactura {
  pago: PagoResponse;
  reserva: ReservaResponse;
}

function formatFecha(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
}

// Tab nuevo, separado de "Mis Reservas": junta los pagos con numero_factura
// de TODAS las reservas del cliente (el backend ya los manda embebidos en
// cada ReservaResponse, ver reserva_schema.py -- no hace falta un endpoint
// nuevo) para que el cliente vea su historial de facturación en un solo
// lugar en vez de tener que abrir reserva por reserva. numero_factura solo
// existe una vez que el pago llegó a 'pagado' (ver _asignar_numero_factura
// en reserva_route.py) -- un pago pendiente/rechazado simplemente no
// aparece acá, no es un dato que falte mostrar.
export default function TabFacturas({ reservas, clienteData }: Props) {
  const facturas = useMemo<FilaFactura[]>(() => {
    return reservas
      .flatMap((reserva) =>
        (reserva.pagos ?? [])
          .filter((pago) => pago.numero_factura)
          .map((pago) => ({ pago, reserva }))
      )
      .sort(
        (a, b) => new Date(b.pago.fecha_pago).getTime() - new Date(a.pago.fecha_pago).getTime(),
      );
  }, [reservas]);

  return (
    <div className="w-full max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
          Facturas
        </h1>
        <p className="text-muted-foreground mt-1">
          Historial de facturas de tus pagos confirmados
        </p>
      </div>

      <div className="bg-card border border-border/50 rounded-3xl p-6 md:p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Receipt className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground">
            {facturas.length} {facturas.length === 1 ? "factura" : "facturas"}
          </h2>
        </div>

        {facturas.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-10">
            <FileText className="w-10 h-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium text-foreground">Todavía no tienes facturas</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs">
              Aparecerán acá apenas se confirme el pago de alguna de tus reservas.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {facturas.map(({ pago, reserva }) => {
              const concepto =
                reserva.nombre_paquete ?? reserva.hotel_nombre ?? reserva.destino ?? `Reserva #${reserva.id_reserva}`;
              return (
                <div
                  key={pago.id_pago}
                  className="flex items-center justify-between gap-3 bg-background border border-border/50 rounded-2xl p-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                      <Receipt className="w-4.5 h-4.5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">
                        {pago.numero_factura}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {concepto} · {formatFecha(pago.fecha_pago)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-bold text-foreground tabular-nums hidden sm:block">
                      ${pago.monto.toLocaleString("es-CO")}
                    </span>
                    <button
                      onClick={() => generarFacturaPdf(pago, reserva, clienteData ?? undefined)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border text-muted-foreground text-xs font-medium rounded-lg hover:bg-muted hover:text-foreground transition-all"
                      title="Descargar factura en PDF"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Descargar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
