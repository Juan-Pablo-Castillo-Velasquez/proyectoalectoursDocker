import {
  Banknote,
  Building2,
  Check,
  CreditCard,
  KeyRound,
  Loader2,
  Pencil,
  Plus,
  Shield,
  Smartphone,
  Trash2,
  Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  MetodoPagoGuardado,
  metodoPagoGuardadoService,
} from "../../services/metodoPagoGuardado.service";

// Antes esta sección vivía como "SECCIÓN 3" adentro de TabCuenta.tsx,
// mezclada entre foto de perfil, datos personales y seguridad -- se movió
// a su propio tab del sidebar (ver ProfileSidebar.tsx/Profile.tsx) para que
// el cliente la encuentre directo en vez de tener que entrar a "Mi Cuenta"
// y bajar hasta la mitad. Toda la lógica (estado, handlers, endpoints) es
// exactamente la misma que ya estaba probada ahí, solo cambió dónde vive.

const TIPOS_METODO_PAGO: { id: string; label: string; icon: typeof CreditCard }[] = [
  { id: "tarjeta_credito", label: "Tarjeta de crédito", icon: CreditCard },
  { id: "tarjeta_debito", label: "Tarjeta de débito", icon: CreditCard },
  { id: "pse", label: "PSE", icon: Building2 },
  { id: "nequi", label: "Nequi", icon: Smartphone },
  { id: "paypal", label: "PayPal", icon: Wallet },
  { id: "otro", label: "Otro", icon: Banknote },
];

function iconoMetodoPago(tipo: string) {
  return TIPOS_METODO_PAGO.find((t) => t.id === tipo)?.icon ?? Banknote;
}

function labelMetodoPago(tipo: string) {
  return TIPOS_METODO_PAGO.find((t) => t.id === tipo)?.label ?? tipo;
}

export default function TabMetodosPago() {
  const [metodosGuardados, setMetodosGuardados] = useState<MetodoPagoGuardado[]>([]);
  const [cargandoMetodos, setCargandoMetodos] = useState(true);
  const [mostrarFormMetodo, setMostrarFormMetodo] = useState(false);
  const [guardandoMetodo, setGuardandoMetodo] = useState(false);
  const [eliminandoMetodoId, setEliminandoMetodoId] = useState<number | null>(null);
  const [editandoMetodoId, setEditandoMetodoId] = useState<number | null>(null);
  const [formMetodo, setFormMetodo] = useState({
    alias: "",
    tipo: "tarjeta_credito",
    ultimos4: "",
    clave: "",
    confirmarClave: "",
    predeterminado: false,
  });

  useEffect(() => {
    metodoPagoGuardadoService
      .getAll()
      .then(setMetodosGuardados)
      .catch(() => setMetodosGuardados([]))
      .finally(() => setCargandoMetodos(false));
  }, []);

  const resetFormMetodo = () => {
    setEditandoMetodoId(null);
    setFormMetodo({
      alias: "",
      tipo: "tarjeta_credito",
      ultimos4: "",
      clave: "",
      confirmarClave: "",
      predeterminado: false,
    });
  };

  const iniciarEdicionMetodo = (metodo: MetodoPagoGuardado) => {
    setEditandoMetodoId(metodo.id_metodo_guardado);
    setMostrarFormMetodo(true);
    setFormMetodo({
      alias: metodo.alias,
      tipo: metodo.tipo,
      ultimos4: metodo.ultimos4 ?? "",
      // La clave real está hasheada y no puede mostrarse: al editar se deja
      // en blanco para CONSERVAR la actual; solo se re-emite si se escribe.
      clave: "",
      confirmarClave: "",
      predeterminado: metodo.predeterminado,
    });
  };

  const handleGuardarMetodo = async () => {
    const esEdicion = editandoMetodoId !== null;
    if (!formMetodo.alias.trim()) {
      toast.error("Ponle un alias a tu método de pago (ej. \"Visa personal\").");
      return;
    }
    if (formMetodo.ultimos4 && !/^\d{4}$/.test(formMetodo.ultimos4)) {
      toast.error("Los últimos 4 dígitos deben ser 4 números.");
      return;
    }
    // Al crear, la clave es obligatoria; al editar, opcional (si se deja en
    // blanco se conserva la actual, que está hasheada y no puede mostrarse).
    const claveIngresada = formMetodo.clave;
    if (claveIngresada && !/^\d{4,6}$/.test(claveIngresada)) {
      toast.error("La clave de confirmación debe ser numérica, de 4 a 6 dígitos.");
      return;
    }
    if (claveIngresada && claveIngresada !== formMetodo.confirmarClave) {
      toast.error("Las claves no coinciden.");
      return;
    }
    if (!esEdicion && !claveIngresada) {
      toast.error("Ingresa una clave de confirmación (4 a 6 dígitos).");
      return;
    }

    setGuardandoMetodo(true);
    try {
      if (esEdicion) {
        const actualizado = await metodoPagoGuardadoService.update(editandoMetodoId, {
          alias: formMetodo.alias.trim(),
          tipo: formMetodo.tipo,
          ultimos4: formMetodo.ultimos4 || undefined,
          ...(claveIngresada ? { clave: claveIngresada } : {}),
          predeterminado: formMetodo.predeterminado,
        });
        setMetodosGuardados((prev) =>
          prev.map((m) =>
            m.id_metodo_guardado === actualizado.id_metodo_guardado
              ? actualizado
              : actualizado.predeterminado
                ? { ...m, predeterminado: false }
                : m
          )
        );
        resetFormMetodo();
        setMostrarFormMetodo(false);
        toast.success("Método de pago actualizado.");
      } else {
        const nuevo = await metodoPagoGuardadoService.create({
          alias: formMetodo.alias.trim(),
          tipo: formMetodo.tipo,
          ultimos4: formMetodo.ultimos4 || undefined,
          clave: formMetodo.clave,
          predeterminado: formMetodo.predeterminado,
        });
        setMetodosGuardados((prev) => [
          nuevo,
          ...(nuevo.predeterminado ? prev.map((m) => ({ ...m, predeterminado: false })) : prev),
        ]);
        resetFormMetodo();
        setMostrarFormMetodo(false);
        toast.success("Método de pago guardado. Tu clave quedó protegida con hash, nunca en texto plano.");
      }
    } catch (err: any) {
      toast.error(err?.message || "No pudimos guardar el método de pago.");
    } finally {
      setGuardandoMetodo(false);
    }
  };

  const handleEliminarMetodo = async (id: number) => {
    setEliminandoMetodoId(id);
    try {
      await metodoPagoGuardadoService.delete(id);
      setMetodosGuardados((prev) => prev.filter((m) => m.id_metodo_guardado !== id));
      toast.success("Método de pago eliminado");
    } catch (err: any) {
      toast.error(err?.message || "No pudimos eliminar este método de pago.");
    } finally {
      setEliminandoMetodoId(null);
    }
  };

  return (
    <div className="w-full max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
          Métodos de Pago
        </h1>
        <p className="text-muted-foreground mt-1">
          Administra las tarjetas y cuentas que usas para pagar tus reservas
        </p>
      </div>

      <div className="bg-card border border-border/50 rounded-3xl p-6 md:p-8 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <Wallet className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Tus métodos guardados</h2>
          </div>
          {!mostrarFormMetodo && (
            <button
              onClick={() => setMostrarFormMetodo(true)}
              className="text-sm font-semibold text-primary hover:text-primary/80 flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Agregar
            </button>
          )}
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Guarda un método de pago con una clave de confirmación propia. Nunca almacenamos el
          número completo de tu tarjeta o cuenta — solo un alias, los últimos 4 dígitos y tu
          clave protegida con hash, la misma técnica que usamos para tu contraseña.
        </p>

        {cargandoMetodos ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Cargando métodos guardados...
          </div>
        ) : (
          <div className="space-y-3 mb-2">
            {metodosGuardados.map((metodo) => {
              const Icon = iconoMetodoPago(metodo.tipo);
              return (
                <div
                  key={metodo.id_metodo_guardado}
                  className="flex items-center justify-between gap-3 bg-background border border-border/50 rounded-2xl p-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                      <Icon className="w-4.5 h-4.5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-foreground truncate flex items-center gap-2">
                        {metodo.alias}
                        {metodo.predeterminado && (
                          <span className="text-[9px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                            Predeterminado
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {labelMetodoPago(metodo.tipo)}
                        {metodo.ultimos4 && ` · •••• ${metodo.ultimos4}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => iniciarEdicionMetodo(metodo)}
                      className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-colors shrink-0"
                      title="Editar método de pago"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEliminarMetodo(metodo.id_metodo_guardado)}
                      disabled={eliminandoMetodoId === metodo.id_metodo_guardado}
                      className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors disabled:opacity-50 shrink-0"
                      title="Eliminar método de pago"
                    >
                      {eliminandoMetodoId === metodo.id_metodo_guardado ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}

            {metodosGuardados.length === 0 && !mostrarFormMetodo && (
              <p className="text-sm text-muted-foreground italic bg-background p-4 rounded-xl border border-border/50">
                Aún no tienes métodos de pago guardados.
              </p>
            )}
          </div>
        )}

        {mostrarFormMetodo && (
          <div className="bg-background border border-primary/30 rounded-2xl p-5 mt-4 space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">
                {editandoMetodoId !== null ? "Editar método de pago" : "Nuevo método de pago"}
              </h3>
            </div>
            {editandoMetodoId !== null && (
              <p className="text-xs text-muted-foreground">
                Deja la clave en blanco para conservar la actual (está protegida con hash, no podemos mostrarla).
              </p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Alias</label>
                <input
                  type="text"
                  value={formMetodo.alias}
                  onChange={(e) => setFormMetodo((f) => ({ ...f, alias: e.target.value }))}
                  placeholder="Ej. Visa personal"
                  className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Tipo</label>
                <select
                  value={formMetodo.tipo}
                  onChange={(e) => setFormMetodo((f) => ({ ...f, tipo: e.target.value }))}
                  className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
                >
                  {TIPOS_METODO_PAGO.map((t) => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">
                  Últimos 4 dígitos (opcional)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  value={formMetodo.ultimos4}
                  onChange={(e) => setFormMetodo((f) => ({ ...f, ultimos4: e.target.value.replace(/\D/g, "") }))}
                  placeholder="1234"
                  className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                  <Shield className="w-3 h-3" /> Marcar como predeterminado
                </span>
                <label className="flex items-center gap-2 px-3 py-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formMetodo.predeterminado}
                    onChange={(e) => setFormMetodo((f) => ({ ...f, predeterminado: e.target.checked }))}
                    className="w-4 h-4 text-primary rounded"
                  />
                  <span className="text-sm text-foreground">Usar por defecto al pagar</span>
                </label>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                  <KeyRound className="w-3 h-3" /> Clave de confirmación (4-6 dígitos)
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={formMetodo.clave}
                  onChange={(e) => setFormMetodo((f) => ({ ...f, clave: e.target.value.replace(/\D/g, "") }))}
                  placeholder="••••"
                  className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Confirmar clave</label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={formMetodo.confirmarClave}
                  onChange={(e) => setFormMetodo((f) => ({ ...f, confirmarClave: e.target.value.replace(/\D/g, "") }))}
                  placeholder="••••"
                  className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleGuardarMetodo}
                disabled={guardandoMetodo}
                className="text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5 px-5 py-2.5 rounded-full transition-colors disabled:opacity-50"
              >
                {guardandoMetodo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                {editandoMetodoId !== null ? "Guardar cambios" : "Guardar método"}
              </button>
              <button
                onClick={() => {
                  setMostrarFormMetodo(false);
                  resetFormMetodo();
                }}
                disabled={guardandoMetodo}
                className="text-sm font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1 px-4 py-2.5 rounded-full transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
