import { Bed, Calendar, CheckCircle2, CreditCard, IdCard, Lock, Mail, MapPin, Phone, Shield, ShieldCheck, Sparkles, User, Users, Zap } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { toast, Toaster } from "sonner";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { ClienteResponse, clienteService } from "../services/cliente.service";
import { HabitacionResponse, HotelResponse, hotelService } from "../services/hotel.service";
import { MetodoPago, pagoService, reservaService } from "../services/reserva.service";
import { MetodoPagoGuardado, metodoPagoGuardadoService } from "../services/metodoPagoGuardado.service";
import CardPayment from "../components/payment/CardPayment";
import PSEPayment from "../components/payment/PSEPayment";
import NequiPayment from "../components/payment/NequiPayment";
import PayPalPayment from "../components/payment/PayPalPayment";
import PaymentSelector from "../components/payment/PaymentSelector";
import PaymentStatus from "../components/payment/PaymentStatus";
import {
  CardPaymentValue, NequiPaymentValue, PSEPaymentValue, PaymentOutcome,
  cardLast4, emptyCardValue, emptyNequiValue, emptyPSEValue,
  isCardValueValid, isNequiValueValid, isPSEValueValid,
} from "../components/payment/types";

const STEPS = [
  { n: 1, label: "Datos del viajero" },
  { n: 2, label: "Fechas y huéspedes" },
  { n: 3, label: "Revisar reserva" },
  { n: 4, label: "Pago" },
];

export default function Checkout() {
  const { id } = useParams(); // id_hotel
  const [searchParams] = useSearchParams();
  const idHabitacion = searchParams.get("habitacion");
  const navigate = useNavigate();
  const { usuario, isAuthenticated } = useAuth();

  const [hotel, setHotel] = useState<HotelResponse | null>(null);
  const [habitacion, setHabitacion] = useState<HabitacionResponse | null>(null);
  const [metodos, setMetodos] = useState<MetodoPago[]>([]);
  // Métodos de pago guardados por el cliente (billetera real, ver
  // MetodoPagoGuardado en el backend) — se usan solo para preseleccionar
  // el método marcado como predeterminado en el paso de pago, nunca para
  // saltarse la elección: el cliente sigue pudiendo cambiarlo.
  const [metodosGuardados, setMetodosGuardados] = useState<MetodoPagoGuardado[]>([]);
  const [cliente, setCliente] = useState<ClienteResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // ── Wizard ──
  const [step, setStep] = useState(1);

  // ── Datos del viajero (prellenados desde el cliente real, editables, solo visual) ──
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [correo, setCorreo] = useState('');
  const [celular, setCelular] = useState('');
  const [cedula, setCedula] = useState('');
  const [direccion, setDireccion] = useState('');
  const [ciudad, setCiudad] = useState('');

  const [people, setPeople] = useState(2);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [metodoPago, setMetodoPago] = useState<number>(1);

  // Prellena fechas/huéspedes si vienen del buscador (SearchBar → HotelCard
  // → HotelDetail → acá, ver esos archivos). Antes se perdían por completo:
  // el cliente elegía sus fechas en el buscador y tenía que volver a
  // escribirlas desde cero en el checkout. Sigue siendo editable — es solo
  // un valor inicial, igual que el resto de datos prellenados del cliente.
  useEffect(() => {
    const start = searchParams.get('start');
    const end = searchParams.get('end');
    const ppl = searchParams.get('people');
    if (start) setFechaInicio(start);
    if (end) setFechaFin(end);
    if (ppl && !Number.isNaN(parseInt(ppl, 10))) setPeople(parseInt(ppl, 10));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [paymentOption, setPaymentOption] = useState<'full' | 'partial'>('full');

  // ── Datos por método de pago (nunca se envía el número completo de
  //    tarjeta al backend, solo los últimos 4 — ver construirDatosMetodo) ──
  const [cardValue, setCardValue] = useState<CardPaymentValue>(emptyCardValue);
  const [pseValue, setPseValue] = useState<PSEPaymentValue>(emptyPSEValue);
  const [nequiValue, setNequiValue] = useState<NequiPaymentValue>(emptyNequiValue);
  const [securityPin, setSecurityPin] = useState('');

  // ── Estado visual del pago: idle mientras se llena el formulario,
  //    processing/approved/rejected una vez enviado (ver PaymentStatus) ──
  const [paymentStatus, setPaymentStatus] = useState<PaymentOutcome>('idle');
  const [reservaActual, setReservaActual] = useState<any>(null);

  // Precio real de la habitación elegida (viene de la BD, no inventado)
  const precioPorNoche = habitacion?.precio_noche ?? 0;
  const nights = fechaInicio && fechaFin
    ? Math.max(1, Math.ceil((new Date(fechaFin).getTime() - new Date(fechaInicio).getTime()) / (1000 * 60 * 60 * 24)))
    : 1;
  const totalPrice = precioPorNoche * nights;
  const paymentAmount = paymentOption === 'full' ? totalPrice : totalPrice * 0.5;

  const metodoSeleccionado = metodos.find((m) => m.id_metodo === metodoPago);
  const codigoMetodo = metodoSeleccionado?.codigo ?? 'otro';
  const esTarjeta = codigoMetodo === 'tarjeta_credito' || codigoMetodo === 'tarjeta_debito';
  const esPSE = codigoMetodo === 'pse';
  const esNequi = codigoMetodo === 'nequi';
  const esPayPal = codigoMetodo === 'paypal';

  // PayPal y el resto de métodos (efectivo, transferencia, etc.) no piden
  // datos adicionales en este entorno simulado — se consideran válidos.
  const metodoValido =
    (esTarjeta && isCardValueValid(cardValue)) ||
    (esPSE && isPSEValueValid(pseValue)) ||
    (esNequi && isNequiValueValid(nequiValue)) ||
    (!esTarjeta && !esPSE && !esNequi);

  // Fase 2 del plan de mejora: antes esto comparaba contra un PIN fijo
  // ('1234', visible en la propia pantalla) — cero seguridad real. Acá
  // solo se valida el formato; la verificación real (o su creación, si es
  // la primera vez que el cliente paga con este tipo de método) pasa por
  // el backend dentro de handleSubmit, contra metodoGuardadoDelTipo.
  const pinCompletado = securityPin.length >= 4;

  // Método guardado (billetera real del cliente, ver MetodoPagoGuardado en
  // el backend) para el TIPO de pago actualmente elegido. Si existe, su
  // PIN ya está hasheado en el backend y hay que verificarlo contra ese;
  // si no, es el primer pago del cliente con este tipo y el PIN que
  // ingrese ahora se guarda como el suyo real para la próxima vez.
  const metodoGuardadoDelTipo = metodosGuardados.find((g) => g.tipo === codigoMetodo);

  const construirDatosMetodo = () => {
    if (esTarjeta) return { ultimos4: cardLast4(cardValue) };
    if (esPSE) return { banco: pseValue.banco, documento: pseValue.documento };
    if (esNequi) return { celular: nequiValue.celular };
    return {};
  };

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    if (!id) return;

    Promise.all([
      hotelService.getById(parseInt(id)), // trae hotel + sus habitaciones reales
      pagoService.getMetodos(),
    ]).then(([h, m]) => {
      setHotel(h);
      setMetodos(m);
      // La preselección real (predeterminado del cliente si tiene uno, si no
      // el primero) la resuelve el useEffect de más abajo una vez también
      // cargan metodosGuardados — acá solo evitamos dejar 0 seleccionado.
      if (m.length > 0) setMetodoPago(m[0].id_metodo);

      // Buscamos la habitación exacta que el usuario eligió en HotelDetail
      const hab = (h as any).habitaciones?.find(
        (hb: HabitacionResponse) => hb.id_habitacion === Number(idHabitacion)
      );
      if (!hab) {
        toast.error('No se encontró la habitación seleccionada. Vuelve a elegirla.');
        navigate(`/hotel/${id}`);
        return;
      }
      if (hab.estado !== 'disponible') {
        toast.error('Esa habitación ya no está disponible.');
        navigate(`/hotel/${id}`);
        return;
      }
      setHabitacion(hab);
    }).catch((err) => {
      // Si `id` no corresponde a ningún hotel real (por ejemplo, un enlace
      // viejo o mal construido que mandaba aquí un id de paquete en vez de
      // un id de hotel), antes esto solo se registraba en consola y la
      // página se quedaba cargando en blanco para siempre. Ahora se avisa
      // y se manda a un lugar siempre válido.
      console.error(err);
      toast.error('No pudimos encontrar ese alojamiento para reservar.');
      navigate('/search');
    })
      .finally(() => setLoading(false));
  }, [id, idHabitacion, isAuthenticated]);

  // Prellenar datos del viajero desde el cliente autenticado (tabla `clientes`: correo, celular, cedula)
  useEffect(() => {
    if (isAuthenticated && usuario?.id_cliente) {
      clienteService.getById(usuario.id_cliente)
        .then((c) => {
          setCliente(c);
          setNombres(c.nombre ?? '');
          setApellidos(c.apellido ?? '');
          setCorreo(c.correo ?? '');
          setCelular(c.celular ?? '');
          setCedula(c.cedula ?? '');
          setDireccion(c.direccion ?? '');
          setCiudad(c.ciudad ?? '');

          // BUG real corregido: el cliente ya tenía estos datos registrados
          // (celular, cédula, nombre) y aun así tenía que volver a
          // escribirlos en el paso de pago para Nequi/PSE/Tarjeta. Solo se
          // prellenan campos que el cliente puede seguir editando — nunca
          // el número de tarjeta ni el CVV, que nunca se guardan completos
          // (MetodoPagoGuardado solo persiste los últimos 4).
          if (c.celular) setNequiValue((prev) => (prev.celular ? prev : { celular: c.celular! }));
          if (c.cedula) setPseValue((prev) => (prev.documento ? prev : { ...prev, documento: c.cedula! }));
          if (c.nombre || c.apellido) {
            const nombreCompleto = `${c.nombre ?? ''} ${c.apellido ?? ''}`.trim();
            setCardValue((prev) => (prev.name ? prev : { ...prev, name: nombreCompleto }));
          }
        })
        .catch(() => setCliente(null));
    }
  }, [isAuthenticated, usuario?.id_cliente]);

  // Trae la billetera real del cliente (métodos de pago que ya registró) —
  // en checkout solo nos interesa para preseleccionar el que marcó como
  // predeterminado; si falla o no tiene ninguno guardado, no rompe nada,
  // el flujo sigue igual que antes (elige él manualmente).
  useEffect(() => {
    if (!isAuthenticated) return;
    metodoPagoGuardadoService.getAll()
      .then(setMetodosGuardados)
      .catch(() => setMetodosGuardados([]));
  }, [isAuthenticated]);

  // Une los métodos de pago reales (GET /metodos-pago) con la billetera del
  // cliente: si tiene un método guardado marcado como predeterminado, y su
  // `tipo` coincide con el `codigo` de alguno de los métodos reales, ese
  // queda preseleccionado en vez del primero de la lista — así el checkout
  // usa de verdad la información que el cliente ya registró.
  useEffect(() => {
    if (metodos.length === 0) return;
    const predeterminado = metodosGuardados.find((g) => g.predeterminado);
    const match = predeterminado ? metodos.find((m) => m.codigo === predeterminado.tipo) : undefined;
    setMetodoPago(match ? match.id_metodo : metodos[0].id_metodo);
  }, [metodos, metodosGuardados]);

  // Aplica el resultado final del pago (ya sea inmediato -tarjeta/PayPal- o
  // tras confirmar uno asíncrono -PSE/Nequi-): navega a la confirmación si
  // fue aprobado, o muestra el estado de rechazo si no.
  const finalizarPago = (estadoPago: string, reservaFinal: any, pago: any) => {
    if (estadoPago === 'pagado') {
      setPaymentStatus('approved');
      toast.success('¡Reserva confirmada!', { id: 'checkout' });
      setTimeout(() => {
        navigate('/confirmation', {
          state: {
            reserva: reservaFinal,
            hotel,
            habitacion,
            people,
            totalPrice,
            paymentAmount: pago.monto,
            paymentOption,
            referencia: pago.referencia,
          },
        });
      }, 900);
    } else {
      setPaymentStatus('rejected');
      toast.error('El pago fue rechazado. Revisa los datos o elige otro método.', { id: 'checkout' });
    }
  };

  // Inicia el pago sobre una reserva ya creada. PSE/Nequi quedan
  // 'procesando' y se confirman aparte (simula la respuesta asíncrona del
  // banco/app); tarjeta/PayPal/otros resuelven al instante, como antes.
  const ejecutarPago = async (reservaId: number) => {
    const { pago, reserva: reservaActualizada } = await reservaService.pagar(reservaId, {
      id_metodo_pago: metodoPago,
      tipo_pago: paymentOption === 'full' ? 'completo' : 'parcial',
      ...construirDatosMetodo(),
    });

    if (pago.estado === 'procesando') {
      setPaymentStatus('processing');
      await new Promise((resolve) => setTimeout(resolve, 2200));
      const confirmado = await pagoService.confirmar(pago.id_pago);
      finalizarPago(confirmado.pago.estado, confirmado.reserva, confirmado.pago);
      return;
    }

    finalizarPago(pago.estado, reservaActualizada, pago);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fechaInicio || !fechaFin) {
      toast.error('Selecciona las fechas de tu estadía');
      setStep(2);
      return;
    }
    if (new Date(fechaFin) <= new Date(fechaInicio)) {
      toast.error('La fecha de salida debe ser después de la entrada');
      setStep(2);
      return;
    }
    if (!usuario?.id_cliente) {
      toast.error('No se encontró tu perfil de cliente. Contacta soporte.');
      return;
    }
    if (!habitacion) {
      toast.error('No hay una habitación válida seleccionada.');
      return;
    }
    if (!metodoValido) {
      toast.error('Revisa los datos del método de pago elegido.');
      return;
    }
    if (securityPin.length < 4) {
      toast.error('Ingresa tu PIN de seguridad (mínimo 4 dígitos).');
      return;
    }

    // Verificación real del PIN (Fase 2 del plan de mejora): si el cliente
    // ya tiene un método guardado de este tipo, se valida contra su PIN
    // hasheado en el backend; si es la primera vez que paga con este tipo
    // de método, el PIN que acaba de escribir se guarda ahora como su
    // método real — ya no hay ningún valor fijo con qué comparar.
    try {
      if (metodoGuardadoDelTipo) {
        const { valido } = await metodoPagoGuardadoService.verificarClave(
          metodoGuardadoDelTipo.id_metodo_guardado,
          securityPin,
        );
        if (!valido) {
          toast.error('El PIN de seguridad no es correcto.');
          return;
        }
      } else {
        const nuevoMetodoGuardado = await metodoPagoGuardadoService.create({
          alias: metodoSeleccionado?.nombre_metodo ?? 'Método de pago',
          tipo: codigoMetodo,
          ultimos4: (construirDatosMetodo() as any).ultimos4,
          clave: securityPin,
        });
        setMetodosGuardados((prev) => [...prev, nuevoMetodoGuardado]);
      }
    } catch (err: any) {
      toast.error(err.message || 'No se pudo confirmar tu PIN de seguridad. Intenta de nuevo.');
      return;
    }

    setIsProcessing(true);
    setPaymentStatus('idle');
    toast.loading('Verificando disponibilidad y creando reserva...', { id: 'checkout' });

    try {
      // Si ya existe una reserva de un intento anterior (p. ej. un pago
      // rechazado), se reutiliza en vez de crear una segunda.
      let reservaId: number | undefined = reservaActual?.id_reserva;
      if (!reservaId) {
        // El precio NO se manda: el backend lo calcula con precio_noche de
        // la BD y valida que la habitación siga disponible (409 si no).
        const reserva = await reservaService.create({
          id_cliente: usuario.id_cliente,
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin,
          numero_personas: people,
          habitaciones: [
            {
              id_habitacion: habitacion.id_habitacion,
              fecha_checkin: fechaInicio,
              fecha_checkout: fechaFin,
            },
          ],
        });
        setReservaActual(reserva);
        reservaId = reserva.id_reserva;
      }

      toast.loading('Procesando pago...', { id: 'checkout' });
      await ejecutarPago(reservaId);
      toast.dismiss('checkout');
    } catch (err: any) {
      // El backend devuelve 409 con mensaje claro si alguien más reservó la habitación primero
      toast.error(err.message || 'Error al procesar la reserva', { id: 'checkout' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetryPago = () => setPaymentStatus('idle');

  const goNext = () => {
    if (step === 2 && (!fechaInicio || !fechaFin)) {
      toast.error('Selecciona las fechas de tu estadía');
      return;
    }
    if (step === 2 && new Date(fechaFin) <= new Date(fechaInicio)) {
      toast.error('La fecha de salida debe ser después de la entrada');
      return;
    }
    setStep((s) => Math.min(4, s + 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goBack = () => {
    setStep((s) => Math.max(1, s - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) return (
    <div className="min-h-screen bg-background transition-colors duration-200">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
        <p className="text-muted-foreground text-sm mt-4 font-medium animate-pulse">Sincronizando pasarela de pagos...</p>
      </div>
    </div>
  );

  if (!hotel || !habitacion) return (
    <div className="min-h-screen bg-background transition-colors duration-200">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-medium text-foreground">El complejo, hotel o habitación no se encuentra disponible</h1>
        <button onClick={() => navigate(-1)} className="mt-4 text-primary font-medium hover:underline">← Regresar</button>
      </div>
    </div>
  );

  const caracteristicasHotel = ((hotel as any).hotel_caracteristicas ?? [])
    .filter((hc: any) => hc.disponible && hc.caracteristica)
    .slice(0, 4);

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
      <Navbar />
      <Toaster position="top-center" richColors />

      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Encabezado */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 shrink-0">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">Completa tu reserva</h1>
                <p className="text-muted-foreground text-sm">Tu viaje está casi listo. Revisa cada paso antes de confirmar.</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-green-500 text-xs font-bold">
              <ShieldCheck className="w-4 h-4" />
              Proceso seguro y protegido
            </div>
          </div>
        </motion.div>

        {/* Stepper */}
        <div className="relative grid grid-cols-4 mb-8">
          <div className="absolute h-0.5 bg-border top-[15px] left-[12.5%] right-[12.5%]" />
          <motion.div
            className="absolute h-0.5 bg-primary top-[15px] left-[12.5%]"
            initial={false}
            animate={{ width: `${((step - 1) / (STEPS.length - 1)) * 75}%` }}
            transition={{ duration: 0.35 }}
          />
          {STEPS.map((s) => (
            <div key={s.n} className="relative z-10 text-center">
              <div
                className={`w-8 h-8 rounded-full mx-auto mb-1.5 flex items-center justify-center text-xs font-extrabold transition-colors ${step > s.n
                  ? "bg-green-500 text-white"
                  : step === s.n
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                  }`}
              >
                {step > s.n ? <CheckCircle2 className="w-4 h-4" /> : s.n}
              </div>
              <span className={`text-[10px] font-bold ${step === s.n ? "text-primary" : step > s.n ? "text-foreground" : "text-muted-foreground"}`}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Columna principal */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">

              {/* PASO 1: Datos del viajero */}
              {step === 1 && (
                <motion.section
                  key="step1"
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  transition={{ duration: 0.25 }}
                  className="bg-card rounded-xl border border-border shadow-xs overflow-hidden"
                >
                  <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-input-background/40">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">Datos de tu cuenta</p>
                        <p className="text-xs text-muted-foreground">Ya tienes una cuenta. No necesitas registrarte de nuevo.</p>
                      </div>
                    </div>
                    <span className="hidden sm:flex items-center gap-1.5 bg-green-500/10 text-green-600 dark:text-green-400 text-[11px] font-bold px-2.5 py-1.5 rounded-lg border border-green-500/20">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Cuenta verificada
                    </span>
                  </div>

                  <div className="p-6 md:p-8">
                    <h2 className="text-xl font-medium text-foreground mb-1">Información del viajero</h2>
                    <p className="text-xs text-muted-foreground mb-5">Estos datos vienen de tu perfil registrado en AlekTours.</p>

                    <div className="flex items-start gap-3 bg-input-background border border-border/60 rounded-xl p-4 mb-5">
                      <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-foreground">Los datos principales ya están asociados a tu cuenta.</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Confirma que la información sea correcta antes de continuar.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Nombres</label>
                        <input
                          value={nombres}
                          onChange={(e) => setNombres(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl border border-border bg-input-background text-foreground text-sm focus:ring-2 focus:ring-primary/40 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Apellidos</label>
                        <input
                          value={apellidos}
                          onChange={(e) => setApellidos(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl border border-border bg-input-background text-foreground text-sm focus:ring-2 focus:ring-primary/40 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Correo electrónico</label>
                        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border bg-input-background">
                          <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                          <input
                            value={correo}
                            onChange={(e) => setCorreo(e.target.value)}
                            className="w-full bg-transparent text-foreground text-sm focus:outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Celular</label>
                        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border bg-input-background">
                          <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                          <input
                            value={celular}
                            onChange={(e) => setCelular(e.target.value)}
                            className="w-full bg-transparent text-foreground text-sm focus:outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Cédula</label>
                        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border bg-input-background">
                          <IdCard className="w-4 h-4 text-muted-foreground shrink-0" />
                          <input
                            value={cedula}
                            onChange={(e) => setCedula(e.target.value)}
                            className="w-full bg-transparent text-foreground text-sm focus:outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Ciudad</label>
                        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border bg-input-background">
                          <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                          <input
                            value={ciudad}
                            onChange={(e) => setCiudad(e.target.value)}
                            className="w-full bg-transparent text-foreground text-sm focus:outline-none"
                          />
                        </div>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Dirección</label>
                        <input
                          value={direccion}
                          onChange={(e) => setDireccion(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl border border-border bg-input-background text-foreground text-sm focus:ring-2 focus:ring-primary/40 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
                      <div className="border border-border rounded-xl p-3.5">
                        <ShieldCheck className="w-4 h-4 text-[#C9A227] mb-1.5" />
                        <b className="block text-xs text-foreground">Datos protegidos</b>
                        <span className="text-[11px] text-muted-foreground">Tratamiento seguro</span>
                      </div>
                      <div className="border border-border rounded-xl p-3.5">
                        <Mail className="w-4 h-4 text-[#C9A227] mb-1.5" />
                        <b className="block text-xs text-foreground">Confirmación por correo</b>
                        <span className="text-[11px] text-muted-foreground">Recibirás el comprobante</span>
                      </div>
                      <div className="border border-border rounded-xl p-3.5">
                        <Shield className="w-4 h-4 text-[#C9A227] mb-1.5" />
                        <b className="block text-xs text-foreground">Soporte 24/7</b>
                        <span className="text-[11px] text-muted-foreground">Asistencia durante el viaje</span>
                      </div>
                    </div>
                  </div>
                </motion.section>
              )}

              {/* PASO 2: Fechas y huéspedes */}
              {step === 2 && (
                <motion.section
                  key="step2"
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  transition={{ duration: 0.25 }}
                  className="bg-card rounded-xl border border-border p-6 md:p-8 shadow-xs"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20">
                      <Calendar className="w-4 h-4 text-primary" />
                    </div>
                    <h2 className="text-lg font-medium text-foreground">Fechas y huéspedes</h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5">Check-in</label>
                      <input type="date" required value={fechaInicio}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => setFechaInicio(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-border bg-input-background text-foreground text-sm focus:ring-2 focus:ring-primary/40 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5">Check-out</label>
                      <input type="date" required value={fechaFin}
                        min={fechaInicio || new Date().toISOString().split('T')[0]}
                        onChange={(e) => setFechaFin(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-border bg-input-background text-foreground text-sm focus:ring-2 focus:ring-primary/40 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5">Huéspedes</label>
                      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border bg-input-background">
                        <Users className="w-4 h-4 text-muted-foreground shrink-0" />
                        <input type="number" min={1} max={habitacion.tipo_habitacion?.capacidad_personas ?? 10}
                          value={people}
                          onChange={(e) => setPeople(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-full bg-transparent text-foreground text-sm focus:outline-none" />
                      </div>
                    </div>
                  </div>

                  {/* Info real de la habitación */}
                  <div className="mt-6 p-4 bg-input-background border border-border/60 rounded-xl">
                    <div className="flex items-start gap-3">
                      <Bed className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-foreground">
                          {habitacion.tipo_habitacion?.nombre_tipo ?? "Habitación"} · #{habitacion.numero_habitacion}
                        </p>
                        {habitacion.tipo_habitacion?.descripcion && (
                          <p className="text-[11px] text-muted-foreground mt-0.5">{habitacion.tipo_habitacion.descripcion}</p>
                        )}
                        <p className="text-[11px] text-muted-foreground mt-1">
                          Capacidad: {habitacion.tipo_habitacion?.capacidad_personas ?? "?"} personas · ${precioPorNoche.toLocaleString('es-CO')} / noche
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Amenidades reales del hotel */}
                  {caracteristicasHotel.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs font-semibold text-foreground mb-2">Amenidades del hotel</p>
                      <div className="flex flex-wrap gap-2">
                        {caracteristicasHotel.map((hc: any) => (
                          <span
                            key={hc.id_caracteristica}
                            className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-primary/5 border border-primary/10 text-primary"
                          >
                            {hc.caracteristica.nombre_caracteristica}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.section>
              )}

              {/* PASO 3: Revisar reserva */}
              {step === 3 && (
                <motion.section
                  key="step3"
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  transition={{ duration: 0.25 }}
                  className="bg-card rounded-xl border border-border p-6 md:p-8 shadow-xs"
                >
                  <h2 className="text-xl font-medium text-foreground mb-1">Revisa tu reserva</h2>
                  <p className="text-xs text-muted-foreground mb-5">Comprueba los datos antes de pasar al pago.</p>

                  <div className="space-y-3">
                    <div className="border border-border rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2.5">
                        <b className="text-xs flex items-center gap-1.5 text-foreground">
                          <Bed className="w-3.5 h-3.5 text-primary" /> Alojamiento
                        </b>
                        <button type="button" onClick={() => setStep(2)} className="text-primary text-[11px] font-bold hover:underline">
                          Editar
                        </button>
                      </div>
                      <div className="flex justify-between text-xs py-1">
                        <span className="text-muted-foreground">Hotel</span>
                        <strong className="text-foreground">{hotel.nombre_hotel}</strong>
                      </div>
                      <div className="flex justify-between text-xs py-1">
                        <span className="text-muted-foreground">Ubicación</span>
                        <strong className="text-foreground">{hotel.ciudad}, {hotel.pais}</strong>
                      </div>
                      <div className="flex justify-between text-xs py-1">
                        <span className="text-muted-foreground">Fechas</span>
                        <strong className="text-foreground">{fechaInicio} → {fechaFin}</strong>
                      </div>
                      <div className="flex justify-between text-xs py-1">
                        <span className="text-muted-foreground">Noches</span>
                        <strong className="text-foreground">{nights}</strong>
                      </div>
                      <div className="flex justify-between text-xs py-1">
                        <span className="text-muted-foreground">Huéspedes</span>
                        <strong className="text-foreground">{people}</strong>
                      </div>
                      <div className="flex justify-between text-xs py-1">
                        <span className="text-muted-foreground">Habitación</span>
                        <strong className="text-foreground">{habitacion.tipo_habitacion?.nombre_tipo ?? "Habitación"} #{habitacion.numero_habitacion}</strong>
                      </div>
                    </div>

                    <div className="border border-border rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2.5">
                        <b className="text-xs flex items-center gap-1.5 text-foreground">
                          <User className="w-3.5 h-3.5 text-primary" /> Viajero principal
                        </b>
                        <button type="button" onClick={() => setStep(1)} className="text-primary text-[11px] font-bold hover:underline">
                          Editar
                        </button>
                      </div>
                      <div className="flex justify-between text-xs py-1">
                        <span className="text-muted-foreground">Nombre</span>
                        <strong className="text-foreground">{nombres} {apellidos}</strong>
                      </div>
                      <div className="flex justify-between text-xs py-1">
                        <span className="text-muted-foreground">Cédula</span>
                        <strong className="text-foreground">{cedula}</strong>
                      </div>
                      <div className="flex justify-between text-xs py-1">
                        <span className="text-muted-foreground">Correo</span>
                        <strong className="text-foreground">{correo}</strong>
                      </div>
                      <div className="flex justify-between text-xs py-1">
                        <span className="text-muted-foreground">Celular</span>
                        <strong className="text-foreground">{celular}</strong>
                      </div>
                      <div className="flex justify-between text-xs py-1">
                        <span className="text-muted-foreground">Ciudad</span>
                        <strong className="text-foreground">{ciudad}</strong>
                      </div>
                    </div>

                    <div className="border border-border rounded-xl p-4">
                      <b className="text-xs flex items-center gap-1.5 text-foreground mb-2.5">
                        <Phone className="w-3.5 h-3.5 text-primary" /> Contacto del hotel
                      </b>
                      <div className="flex justify-between text-xs py-1">
                        <span className="text-muted-foreground">Dirección</span>
                        <strong className="text-foreground text-right">{hotel.direccion ?? "—"}</strong>
                      </div>
                      <div className="flex justify-between text-xs py-1">
                        <span className="text-muted-foreground">Teléfono</span>
                        <strong className="text-foreground">{hotel.telefono ?? "—"}</strong>
                      </div>
                      <div className="flex justify-between text-xs py-1">
                        <span className="text-muted-foreground">Correo</span>
                        <strong className="text-foreground">{hotel.correo_electronico ?? "—"}</strong>
                      </div>
                    </div>
                  </div>
                </motion.section>
              )}

              {/* PASO 4: Pago */}
              {step === 4 && (
                <motion.section
                  key="step4"
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-6"
                >
                  {paymentStatus !== 'idle' ? (
                    <PaymentStatus
                      state={paymentStatus}
                      amount={paymentAmount}
                      onRetry={paymentStatus === 'rejected' ? handleRetryPago : undefined}
                    />
                  ) : (
                  <>
                  {/* Paso 1: Fraccionamiento de Pago */}
                  <div className="bg-card rounded-xl border border-border p-6 shadow-xs">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-9 h-9 bg-chart-2/10 rounded-lg flex items-center justify-center border border-chart-2/20">
                        <Zap className="w-4 h-4 text-chart-2" />
                      </div>
                      <div>
                        <h2 className="text-lg font-medium text-foreground">1. Elige cuánto pagar hoy</h2>
                        <p className="text-xs text-muted-foreground">Define el monto antes de asignar tu método de pago.</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <motion.label whileHover={{ y: -1 }}
                        className={`flex items-start gap-4 p-5 rounded-xl cursor-pointer border transition-all ${paymentOption === 'full' ? 'border-primary bg-primary/5 shadow-xs' : 'border-border bg-card'
                          }`}>
                        <input type="radio" name="payment" checked={paymentOption === 'full'}
                          onChange={() => setPaymentOption('full')}
                          className="mt-1 w-4 h-4 text-primary focus:ring-primary border-border bg-input-background" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1 gap-2 flex-wrap">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm md:text-base text-foreground">Pago de contado</span>
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            </div>
                            <span className="text-base md:text-lg font-bold text-foreground">
                              ${totalPrice.toLocaleString('es-CO')}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">Liquida el 100% del monto hoy y olvídate de cargos posteriores.</p>
                        </div>
                      </motion.label>

                      <motion.label whileHover={{ y: -1 }}
                        className={`flex items-start gap-4 p-5 rounded-xl cursor-pointer border transition-all ${paymentOption === 'partial' ? 'border-primary bg-primary/5 shadow-xs' : 'border-border bg-card'
                          }`}>
                        <input type="radio" name="payment" checked={paymentOption === 'partial'}
                          onChange={() => setPaymentOption('partial')}
                          className="mt-1 w-4 h-4 text-primary focus:ring-primary border-border bg-input-background" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1 gap-2 flex-wrap">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm md:text-base text-foreground">Pago diferido (50% anticipo)</span>
                              <Sparkles className="w-4 h-4 text-chart-2" />
                            </div>
                            <span className="text-base md:text-lg font-bold text-primary">
                              ${(totalPrice * 0.5).toLocaleString('es-CO')}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">Asegura tu cupo con la mitad y cubre el saldo restante 15 días antes de tu viaje.</p>
                        </div>
                      </motion.label>
                    </div>
                  </div>

                  {/* Paso 2: Métodos de pago */}
                  <div className="bg-card rounded-xl border border-border p-6 shadow-xs">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-9 h-9 bg-green-500/10 rounded-lg flex items-center justify-center border border-green-500/20">
                        <CreditCard className="w-4 h-4 text-green-500" />
                      </div>
                      <div>
                        <h2 className="text-lg font-medium text-foreground">2. Elige tu método de pago</h2>
                        <p className="text-xs text-muted-foreground">Selecciona cómo quieres pagar {paymentOption === 'partial' ? 'el anticipo' : 'tu reserva'}.</p>
                      </div>
                    </div>
                    {metodosGuardados.some((g) => g.predeterminado) && (
                      <p className="text-[11px] text-muted-foreground mb-3 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                        Preseleccionamos tu método de pago predeterminado — puedes cambiarlo si prefieres usar otro.
                      </p>
                    )}
                    <PaymentSelector metodos={metodos} selectedId={metodoPago} onSelect={setMetodoPago} />
                  </div>

                  {/* Datos específicos del método elegido — cada uno vive en su propio
                      componente aislado dentro de components/payment/ */}
                  <AnimatePresence>
                    {(esTarjeta || esPSE || esNequi || esPayPal) && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="bg-card rounded-xl border border-border p-6 shadow-xs">
                          <div className="flex items-center gap-3 mb-5">
                            <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20">
                              <CreditCard className="w-4 h-4 text-primary" />
                            </div>
                            <h2 className="text-lg font-medium text-foreground">
                              {esTarjeta ? 'Datos de la tarjeta' : esPSE ? 'Datos de PSE' : esNequi ? 'Datos de Nequi' : 'PayPal'}
                            </h2>
                          </div>

                          {esTarjeta && (
                            <CardPayment value={cardValue} onChange={setCardValue} brand={metodoSeleccionado?.nombre_metodo} />
                          )}
                          {esPSE && <PSEPayment value={pseValue} onChange={setPseValue} />}
                          {esNequi && <NequiPayment value={nequiValue} onChange={setNequiValue} />}
                          {esPayPal && <PayPalPayment amount={paymentAmount} />}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Paso 3: PIN de seguridad */}
                  <div className="bg-card rounded-xl border border-border p-6 shadow-xs">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20">
                        <Lock className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-lg font-medium text-foreground">3. Confirma con tu PIN de seguridad</h2>
                        <p className="text-xs text-muted-foreground">
                          {metodoGuardadoDelTipo
                            ? <>Ingresa el PIN que configuraste para <span className="font-medium text-foreground">{metodoGuardadoDelTipo.alias}</span>.</>
                            : 'Es tu primer pago con este método: crea un PIN de 4 a 6 dígitos, lo usarás también en tus próximos pagos.'}
                        </p>
                      </div>
                    </div>
                    <input
                      type="password" inputMode="numeric" placeholder="••••"
                      value={securityPin}
                      onChange={(e) => setSecurityPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      maxLength={6}
                      className="w-full max-w-[160px] px-4 py-3 rounded-xl border border-border bg-input-background text-foreground text-center text-2xl tracking-[0.5em] font-mono focus:ring-2 focus:ring-primary/40 focus:outline-none"
                    />
                  </div>

                  {/* Badge SSL */}
                  <div className="flex items-center gap-3 p-4 bg-green-500/5 rounded-xl border border-green-500/10 transition-colors">
                    <Shield className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-xs text-muted-foreground font-medium">Transacción protegida mediante encriptación SSL de 256 bits</span>
                  </div>
                  </>
                  )}
                </motion.section>
              )}
            </AnimatePresence>

            {/* Navegación del wizard */}
            <div className="flex items-center justify-between mt-6">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={goBack}
                  className="text-muted-foreground hover:text-foreground text-sm font-semibold"
                >
                  ← Volver
                </button>
              ) : <span />}

              {step < 4 ? (
                <button
                  type="button"
                  onClick={goNext}
                  className="px-6 py-3 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:opacity-95 transition-all shadow-sm"
                >
                  {step === 3 ? "Ir al pago" : "Continuar"} →
                </button>
              ) : (
                <div className="flex flex-col items-end gap-1.5">
                  {(!metodoValido || !pinCompletado) && (
                    <p className="text-[11px] text-muted-foreground">
                      {!metodoValido
                        ? 'Completa los datos del método de pago para continuar.'
                        : 'Ingresa tu PIN de seguridad para continuar.'}
                    </p>
                  )}
                  <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                    type="submit" disabled={isProcessing || paymentStatus === 'processing' || paymentStatus === 'approved'}
                    className="min-w-[220px] py-3.5 px-6 bg-primary text-primary-foreground text-sm font-semibold rounded-xl border border-transparent shadow-md hover:opacity-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden">
                    <span className="relative flex items-center justify-center gap-2.5">
                      {isProcessing ? 'Garantizando transacciones...' : (
                        <><Lock className="w-4 h-4" />Confirmar y autorizar ${paymentAmount.toLocaleString('es-CO')}</>
                      )}
                    </span>
                  </motion.button>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Resumen Desglose */}
          <div className="lg:col-span-1">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
              className="bg-card rounded-xl border border-border p-6 sticky top-24 shadow-xs">
              <h2 className="text-lg font-medium text-foreground mb-4">Resumen de itinerario</h2>

              {/* Mini card del hotel + habitación seleccionada */}
              <div className="mb-6 p-4 bg-muted/60 border border-border rounded-xl">
                <p className="font-bold text-foreground text-base leading-tight">{hotel.nombre_hotel}</p>
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {hotel.ciudad}, {hotel.pais}
                </p>
                <div className="flex items-center gap-1.5 mt-2 text-xs text-primary font-medium">
                  <Bed className="w-3.5 h-3.5" />
                  {habitacion.tipo_habitacion?.nombre_tipo ?? "Habitación"} · #{habitacion.numero_habitacion}
                </div>
                <div className="flex gap-0.5 mt-2">
                  {Array.from({ length: hotel.calificacion || 5 }, (_, i) => (
                    <span key={i} className="text-chart-2 text-xs">★</span>
                  ))}
                </div>
              </div>

              {/* Desglose matemático — con precio REAL de la habitación */}
              <div className="space-y-3 pb-4 border-b border-border text-xs md:text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tarifa por noche</span>
                  <span className="font-medium text-foreground">${precioPorNoche.toLocaleString('es-CO')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pasajeros inscritos</span>
                  <span className="font-medium text-foreground">{people}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Noches de hospedaje</span>
                  <span className="font-medium text-foreground">{nights}</span>
                </div>
                <div className="flex justify-between text-sm md:text-base pt-2 border-t border-dashed border-border mt-2">
                  <span className="font-semibold text-foreground">Total bruto</span>
                  <span className="font-bold text-foreground">${totalPrice.toLocaleString('es-CO')}</span>
                </div>
              </div>

              {/* Total final a pagar ahora */}
              <div className="mt-4 p-4 bg-primary/5 rounded-xl border border-primary/10">
                <div className="flex justify-between items-center gap-2">
                  <span className="font-semibold text-xs md:text-sm text-foreground">Cargos actuales</span>
                  <span className="text-xl md:text-2xl font-bold text-primary tracking-tight">
                    ${paymentAmount.toLocaleString('es-CO')}
                  </span>
                </div>
                {paymentOption === 'partial' && (
                  <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
                    Un saldo de ${(totalPrice * 0.5).toLocaleString('es-CO')} quedará pendiente en tu panel para liquidarse previo al arribo.
                  </p>
                )}
              </div>
            </motion.div>
          </div>
        </form>
      </div>
    </div>
  );
}