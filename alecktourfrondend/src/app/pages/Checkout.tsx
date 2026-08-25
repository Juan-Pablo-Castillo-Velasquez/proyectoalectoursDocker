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
  const [paymentOption, setPaymentOption] = useState<'full' | 'partial'>('full');

  // ── Simulación realista del método de pago (nunca se envía al backend:
  //    el backend solo recibe id_metodo_pago y tipo_pago, ver handleSubmit) ──
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [securityPin, setSecurityPin] = useState('');
  const DEMO_PIN = '1234';

  // Precio real de la habitación elegida (viene de la BD, no inventado)
  const precioPorNoche = habitacion?.precio_noche ?? 0;
  const nights = fechaInicio && fechaFin
    ? Math.max(1, Math.ceil((new Date(fechaFin).getTime() - new Date(fechaInicio).getTime()) / (1000 * 60 * 60 * 24)))
    : 1;
  const totalPrice = precioPorNoche * nights;
  const paymentAmount = paymentOption === 'full' ? totalPrice : totalPrice * 0.5;

  const metodoSeleccionado = metodos.find((m) => m.id_metodo === metodoPago);
  const esTarjeta = /tarjeta/i.test(metodoSeleccionado?.nombre_metodo ?? '');

  const formatCardNumber = (v: string) =>
    v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();

  const formatExpiry = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, 4);
    return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
  };

  const expiryValida = (() => {
    const match = /^(\d{2})\/(\d{2})$/.exec(cardExpiry);
    if (!match) return false;
    const mes = parseInt(match[1], 10);
    const anio = 2000 + parseInt(match[2], 10);
    if (mes < 1 || mes > 12) return false;
    const ahora = new Date();
    const finMes = new Date(anio, mes, 0);
    return finMes >= new Date(ahora.getFullYear(), ahora.getMonth(), 1);
  })();

  const tarjetaValida =
    !esTarjeta ||
    (cardNumber.replace(/\s/g, '').length === 16 &&
      cardName.trim().length > 2 &&
      expiryValida &&
      cardCvv.length >= 3);

  const pinValido = securityPin === DEMO_PIN;

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    if (!id) return;

    Promise.all([
      hotelService.getById(parseInt(id)), // trae hotel + sus habitaciones reales
      pagoService.getMetodos(),
    ]).then(([h, m]) => {
      setHotel(h);
      setMetodos(m);
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
    }).catch(console.error)
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
        })
        .catch(() => setCliente(null));
    }
  }, [isAuthenticated, usuario?.id_cliente]);

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
    if (esTarjeta && !tarjetaValida) {
      toast.error('Revisa los datos de tu tarjeta: número, nombre, vencimiento y CVV.');
      return;
    }
    if (!pinValido) {
      toast.error('PIN de seguridad incorrecto. En este entorno de prueba es 1234.');
      return;
    }

    setIsProcessing(true);
    toast.loading('Verificando disponibilidad y creando reserva...', { id: 'checkout' });

    try {
      // 1. Crear reserva con la habitación real.
      //    El precio NO se manda: el backend lo calcula con precio_noche de la BD
      //    y valida que la habitación siga disponible en esas fechas (409 si no).
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

      toast.loading('Procesando pago...', { id: 'checkout' });

      // 2. Registrar el pago — el backend calcula y valida el monto real
      //    (habitaciones/servicios de la reserva) y confirma la reserva.
      const { pago, reserva: reservaConfirmada } = await reservaService.pagar(reserva.id_reserva, {
        id_metodo_pago: metodoPago,
        tipo_pago: paymentOption === 'full' ? 'completo' : 'parcial',
      });

      toast.success('¡Reserva confirmada!', { id: 'checkout' });

      setTimeout(() => {
        navigate('/confirmation', {
          state: {
            reserva: reservaConfirmada,
            hotel,
            habitacion,
            people,
            totalPrice,
            paymentAmount: pago.monto,
            paymentOption,
            referencia: pago.referencia,
          },
        });
      }, 500);

    } catch (err: any) {
      // El backend devuelve 409 con mensaje claro si alguien más reservó la habitación primero
      toast.error(err.message || 'Error al procesar la reserva', { id: 'checkout' });
    } finally {
      setIsProcessing(false);
    }
  };

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
                    <p className="text-xs text-muted-foreground mb-5">Estos datos vienen de tu perfil registrado en AleckTours.</p>

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
                  {/* Métodos de pago */}
                  <div className="bg-card rounded-xl border border-border p-6 shadow-xs">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-9 h-9 bg-green-500/10 rounded-lg flex items-center justify-center border border-green-500/20">
                        <CreditCard className="w-4 h-4 text-green-500" />
                      </div>
                      <h2 className="text-lg font-medium text-foreground">Método de pago</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {metodos.map(m => (
                        <motion.label key={m.id_metodo} whileHover={{ y: -1 }}
                          className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer border transition-all ${metodoPago === m.id_metodo
                            ? 'border-primary bg-primary/5 shadow-xs'
                            : 'border-border bg-card hover:border-border/80'
                            }`}>
                          <input type="radio" name="metodo" checked={metodoPago === m.id_metodo}
                            onChange={() => setMetodoPago(m.id_metodo)}
                            className="w-4 h-4 text-primary focus:ring-primary border-border bg-input-background" />
                          <span className="text-sm font-medium text-foreground">{m.nombre_metodo}</span>
                        </motion.label>
                      ))}
                    </div>
                  </div>

                  {/* Datos de la tarjeta (solo si el método elegido es tarjeta) */}
                  <AnimatePresence>
                    {esTarjeta && (
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
                            <h2 className="text-lg font-medium text-foreground">Datos de la tarjeta</h2>
                          </div>

                          {/* Tarjeta visual */}
                          <div className="relative w-full max-w-sm mx-auto sm:mx-0 mb-6 rounded-2xl p-5 text-white shadow-lg"
                            style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #2E2E2E 100%)' }}>
                            <div className="flex justify-between items-start mb-8">
                              <div className="w-10 h-7 rounded bg-white/20" />
                              <span className="text-xs font-semibold tracking-widest opacity-80">
                                {metodoSeleccionado?.nombre_metodo}
                              </span>
                            </div>
                            <p className="text-lg tracking-[0.2em] font-mono mb-4">
                              {cardNumber || '•••• •••• •••• ••••'}
                            </p>
                            <div className="flex justify-between text-xs opacity-90">
                              <span className="uppercase truncate max-w-[60%]">{cardName || 'NOMBRE DEL TITULAR'}</span>
                              <span>{cardExpiry || 'MM/YY'}</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 gap-4">
                            <div>
                              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Número de tarjeta</label>
                              <input
                                type="text" inputMode="numeric" placeholder="0000 0000 0000 0000"
                                value={cardNumber}
                                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                                maxLength={19}
                                className="w-full px-3 py-2.5 rounded-xl border border-border bg-input-background text-foreground text-sm font-mono focus:ring-2 focus:ring-primary/40 focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Nombre del titular</label>
                              <input
                                type="text" placeholder="Como aparece en la tarjeta"
                                value={cardName}
                                onChange={(e) => setCardName(e.target.value.toUpperCase())}
                                className="w-full px-3 py-2.5 rounded-xl border border-border bg-input-background text-foreground text-sm focus:ring-2 focus:ring-primary/40 focus:outline-none"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Vencimiento</label>
                                <input
                                  type="text" inputMode="numeric" placeholder="MM/YY"
                                  value={cardExpiry}
                                  onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                                  maxLength={5}
                                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-input-background text-foreground text-sm focus:ring-2 focus:ring-primary/40 focus:outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-muted-foreground mb-1.5">CVV</label>
                                <input
                                  type="password" inputMode="numeric" placeholder="•••"
                                  value={cardCvv}
                                  onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                  maxLength={4}
                                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-input-background text-foreground text-sm focus:ring-2 focus:ring-primary/40 focus:outline-none"
                                />
                              </div>
                            </div>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-4 flex items-center gap-1.5">
                            <Shield className="w-3.5 h-3.5 text-green-500 shrink-0" />
                            Datos de prueba: no se procesa ni se guarda ningún cobro real.
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Fraccionamiento de Pago */}
                  <div className="bg-card rounded-xl border border-border p-6 shadow-xs">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-9 h-9 bg-chart-2/10 rounded-lg flex items-center justify-center border border-chart-2/20">
                        <Zap className="w-4 h-4 text-chart-2" />
                      </div>
                      <h2 className="text-lg font-medium text-foreground">Opciones de financiamiento</h2>
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

                  {/* PIN de seguridad */}
                  <div className="bg-card rounded-xl border border-border p-6 shadow-xs">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20">
                        <Lock className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-lg font-medium text-foreground">Confirma con tu PIN de seguridad</h2>
                        <p className="text-xs text-muted-foreground">Entorno de prueba: tu PIN es <span className="font-mono font-bold">1234</span></p>
                      </div>
                    </div>
                    <input
                      type="password" inputMode="numeric" placeholder="••••"
                      value={securityPin}
                      onChange={(e) => setSecurityPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      maxLength={4}
                      className="w-full max-w-[160px] px-4 py-3 rounded-xl border border-border bg-input-background text-foreground text-center text-2xl tracking-[0.5em] font-mono focus:ring-2 focus:ring-primary/40 focus:outline-none"
                    />
                  </div>

                  {/* Badge SSL */}
                  <div className="flex items-center gap-3 p-4 bg-green-500/5 rounded-xl border border-green-500/10 transition-colors">
                    <Shield className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-xs text-muted-foreground font-medium">Transacción protegida mediante encriptación SSL de 256 bits</span>
                  </div>
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
                <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                  type="submit" disabled={isProcessing || (esTarjeta && !tarjetaValida) || !pinValido}
                  className="min-w-[220px] py-3.5 px-6 bg-primary text-primary-foreground text-sm font-semibold rounded-xl border border-transparent shadow-md hover:opacity-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden">
                  <span className="relative flex items-center justify-center gap-2.5">
                    {isProcessing ? 'Garantizando transacciones...' : (
                      <><Lock className="w-4 h-4" />Confirmar y autorizar ${paymentAmount.toLocaleString('es-CO')}</>
                    )}
                  </span>
                </motion.button>
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