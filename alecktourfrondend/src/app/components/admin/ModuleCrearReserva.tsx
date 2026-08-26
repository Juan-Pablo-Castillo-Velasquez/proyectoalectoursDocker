import { useState } from "react";
import { Cliente, Paquete, inputCls, labelCls } from "./types";

interface Props {
  clientes: Cliente[];
  paquetes: Paquete[];
  onSubmit: (data: any) => Promise<void>;
  loading: boolean;
}

export default function ModuleCrearReserva({ clientes, paquetes, onSubmit, loading }: Props) {
  const [form, setForm] = useState({
    id_cliente: "", id_paquete: "", fecha_inicio: "",
    fecha_fin: "", numero_personas: "1", estado: "pendiente"
  });
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    try {
      await onSubmit({
        ...form,
        id_cliente: parseInt(form.id_cliente),
        id_paquete: parseInt(form.id_paquete),
        numero_personas: parseInt(form.numero_personas),
      });
      setMsg({ type: "ok", text: "Reserva creada exitosamente" });
      setForm({ id_cliente: "", id_paquete: "", fecha_inicio: "", fecha_fin: "", numero_personas: "1", estado: "pendiente" });
    } catch (err: any) {
      setMsg({ type: "err", text: err.message || "Error al crear reserva" });
    }
  };

  const paqueteSeleccionado = paquetes.find(p => p.id_paquete === parseInt(form.id_paquete));
  const clienteSeleccionado = clientes.find(c => c.id_cliente === parseInt(form.id_cliente));
  const total = paqueteSeleccionado
    ? paqueteSeleccionado.precio_base * parseInt(form.numero_personas || "1")
    : 0;

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Crear Reserva</h2>
        <p className="text-muted-foreground text-sm">Registra una nueva reserva para un cliente</p>
      </div>

      <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
        <form onSubmit={handleSubmit} className="space-y-4">
          {msg && (
            <div className={`p-3 rounded-xl text-sm font-medium ${msg.type === "ok" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
              {msg.text}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Cliente</label>
              <select value={form.id_cliente}
                onChange={e => setForm({ ...form, id_cliente: e.target.value })}
                className={inputCls} required>
                <option value="">Seleccionar cliente...</option>
                {clientes.map(c => (
                  <option key={c.id_cliente} value={c.id_cliente}>
                    {c.nombre} {c.apellido} — {c.cedula}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Paquete</label>
              <select value={form.id_paquete}
                onChange={e => setForm({ ...form, id_paquete: e.target.value })}
                className={inputCls} required>
                <option value="">Seleccionar paquete...</option>
                {paquetes.map(p => (
                  <option key={p.id_paquete} value={p.id_paquete}>
                    {p.nombre_paquete} — ${p.precio_base?.toLocaleString()} ({p.duracion_dias}d)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Fecha inicio</label>
              <input type="date" value={form.fecha_inicio}
                onChange={e => setForm({ ...form, fecha_inicio: e.target.value })}
                className={inputCls} required />
            </div>
            <div>
              <label className={labelCls}>Fecha fin</label>
              <input type="date" value={form.fecha_fin}
                onChange={e => setForm({ ...form, fecha_fin: e.target.value })}
                className={inputCls} required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Número de personas</label>
              <input type="number" min="1" value={form.numero_personas}
                onChange={e => setForm({ ...form, numero_personas: e.target.value })}
                className={inputCls} required />
            </div>
            <div>
              <label className={labelCls}>Estado</label>
              <select value={form.estado}
                onChange={e => setForm({ ...form, estado: e.target.value })}
                className={inputCls}>
                {["pendiente", "confirmada", "cancelada", "finalizada"].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {paqueteSeleccionado && (
            <div className="bg-accent rounded-xl p-4 text-sm space-y-1">
              <p className="font-semibold text-primary">Resumen de reserva</p>
              {clienteSeleccionado && <p className="text-accent-foreground">Cliente: {clienteSeleccionado.nombre} {clienteSeleccionado.apellido}</p>}
              <p className="text-accent-foreground">Paquete: {paqueteSeleccionado.nombre_paquete}</p>
              <p className="text-accent-foreground">Duración: {paqueteSeleccionado.duracion_dias} días</p>
              <p className="font-bold text-primary text-base">Total estimado: ${total.toLocaleString()}</p>
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-[#2563EB] to-[#06B6D4] text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50">
            {loading ? "Creando..." : "Crear Reserva"}
          </button>
        </form>
      </div>
    </div>
  );
}