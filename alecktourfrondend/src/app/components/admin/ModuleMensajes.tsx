import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, Check, ChevronUp, Copy, CreditCard, Download, FileText, Info, Mail, MapPin, MessageCircle, Paperclip, Phone, Search, Send, X, type LucideIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import EmptyState from "./ui/EmptyState";
import SectionHeader from "./ui/SectionHeader";
import { Cliente, Reserva, inputCls, resolveFotoUrl } from "./types";
import {
  MENSAJE_CONTENIDO_MAX_LENGTH,
  mensajeChatService,
  type HiloResumen,
  type MensajeChat,
} from "../../services/mensajeChat.service";

// Chat privado admin<->cliente -- bandeja compartida (cualquier admin ve y
// responde cualquier hilo) y un solo hilo continuo por cliente (no uno por
// reserva). Solo polling, sin websockets -- ver el comentario de
// mensaje_chat_route.py: el backend está en el plan free de Render, que
// duerme tras 15 min de inactividad y mataría cualquier socket abierto.
const POLL_HILOS_MS = 9000;
const POLL_MENSAJES_MS = 5000;
const LIMITE_HILOS = 20;
// Mismo límite que devuelve MensajeChatRepository.get_mensajes por defecto
// (backend) -- si la carga trae exactamente este número, asumimos que
// puede haber más historial antes y mostramos "Cargar mensajes anteriores".
const LIMITE_HISTORIAL = 50;

// Mismos tokens visuales que cardCls (types.ts) pero sin su padding fijo
// -- este panel necesita p-0 para que la lista/el chat lleguen al borde.
const panelCls = "bg-card rounded-2xl shadow-sm border border-border overflow-hidden flex flex-col";

interface Props {
  // Reservas y clientes ya cargados por Admindashboard.tsx (mismos datos
  // que usan ModuleReservas/ModuleClientes) -- alimentan el selector "¿de
  // qué reserva habla?" y el nombre de respaldo cuando se entra a un hilo
  // sin mensajes todavía (deep-link desde "Ver mensajes" en Clientes). Sin
  // ellos, el chat sigue funcionando igual, solo sin esos extras.
  reservas?: Reserva[];
  clientes?: Cliente[];
  // Deep-link desde ModuleClientes ("Ver mensajes de este cliente").
  clienteIdInicial?: number | null;
  // Deep-link inverso: abrir en Módulo Reservas la reserva etiquetada en un
  // mensaje -- mismo prop que ya reciben ModulePagos/ModuleCancelaciones.
  onVerReserva?: (id: number) => void;
}

export default function ModuleMensajes({ reservas = [], clientes = [], clienteIdInicial = null, onVerReserva }: Props) {
  const [hilos, setHilos] = useState<HiloResumen[]>([]);
  const [totalHilos, setTotalHilos] = useState(0);
  const [hilosLoading, setHilosLoading] = useState(true);
  const [hilosLoadingMore, setHilosLoadingMore] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchHilos, setSearchHilos] = useState("");
  const [idClienteActivo, setIdClienteActivo] = useState<number | null>(null);
  const [mensajes, setMensajes] = useState<MensajeChat[]>([]);
  const [mensajesLoading, setMensajesLoading] = useState(false);
  const [hayMasAnteriores, setHayMasAnteriores] = useState(false);
  const [cargandoAnteriores, setCargandoAnteriores] = useState(false);
  const [texto, setTexto] = useState("");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [idReservaSeleccionada, setIdReservaSeleccionada] = useState<number | null>(null);
  const [busquedaReserva, setBusquedaReserva] = useState("");
  const [infoClienteAbierta, setInfoClienteAbierta] = useState(false);
  const [campoCopiado, setCampoCopiado] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [imagenAmpliada, setImagenAmpliada] = useState<string | undefined>(undefined);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mensajesRef = useRef<MensajeChat[]>([]);
  mensajesRef.current = mensajes;
  const hilosRef = useRef<HiloResumen[]>([]);
  hilosRef.current = hilos;
  const searchHilosRef = useRef(searchHilos);
  searchHilosRef.current = searchHilos;

  // Debounce simple del cuadro de búsqueda -- evita una petición por cada
  // tecla presionada (ver getHilos(search) en mensajeChat.service.ts).
  useEffect(() => {
    const t = setTimeout(() => setSearchHilos(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  // append=false (reset): recarga desde el principio, conservando cuántos
  // hilos ya se habían cargado (para que el polling no borre un "Cargar
  // más" anterior). append=true: trae la siguiente página y la agrega.
  const cargarHilos = (append = false) => {
    const cargadosActuales = hilosRef.current.length;
    const limit = append ? LIMITE_HILOS : Math.max(cargadosActuales, LIMITE_HILOS);
    const skip = append ? cargadosActuales : 0;
    const setter = append ? setHilosLoadingMore : setHilosLoading;
    setter(true);
    return mensajeChatService
      .getHilos({ search: searchHilosRef.current || undefined, skip, limit })
      .then((data) => {
        setHilos((prev) => (append ? [...prev, ...data.items] : data.items));
        setTotalHilos(data.total);
      })
      .catch(() => {
        /* no crítico -- el próximo ciclo de polling reintenta */
      })
      .finally(() => setter(false));
  };

  useEffect(() => {
    cargarHilos(false);
    const interval = setInterval(() => cargarHilos(false), POLL_HILOS_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchHilos]);

  // Deep-link desde ModuleClientes ("Ver mensajes de este cliente").
  useEffect(() => {
    if (clienteIdInicial != null) setIdClienteActivo(clienteIdInicial);
  }, [clienteIdInicial]);

  // Carga completa del hilo al seleccionar un cliente -- y marca como
  // leídos sus mensajes de una vez (equivalente a "abrir la conversación").
  useEffect(() => {
    if (idClienteActivo == null) return;
    let vivo = true;
    setMensajesLoading(true);
    setIdReservaSeleccionada(null);
    setBusquedaReserva("");
    setInfoClienteAbierta(false);
    mensajeChatService
      .getHilo(idClienteActivo)
      .then((data) => {
        if (!vivo) return;
        setMensajes(data);
        setHayMasAnteriores(data.length >= LIMITE_HISTORIAL);
      })
      .catch(() => {})
      .finally(() => {
        if (vivo) setMensajesLoading(false);
      });
    mensajeChatService.marcarLeido(idClienteActivo).then(() => cargarHilos(false)).catch(() => {});
    return () => {
      vivo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idClienteActivo]);

  // Polling incremental del hilo abierto -- solo pide lo posterior al
  // último mensaje ya cargado (after_id), nunca vuelve a traer todo el
  // hilo en cada ciclo de 5s.
  useEffect(() => {
    if (idClienteActivo == null) return;
    const interval = setInterval(async () => {
      const actuales = mensajesRef.current;
      const ultimoId = actuales.length ? actuales[actuales.length - 1].id_mensaje : undefined;
      try {
        const nuevos = await mensajeChatService.getHilo(idClienteActivo, { afterId: ultimoId });
        if (nuevos.length > 0) {
          setMensajes((prev) => [...prev, ...nuevos]);
          if (nuevos.some((m) => m.remitente_tipo === "cliente")) {
            mensajeChatService.marcarLeido(idClienteActivo).then(() => cargarHilos(false)).catch(() => {});
          }
        }
      } catch {
        /* se reintenta en el próximo ciclo */
      }
    }, POLL_MENSAJES_MS);
    return () => clearInterval(interval);
  }, [idClienteActivo]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [mensajes.length]);

  const cargarAnteriores = async () => {
    if (idClienteActivo == null || mensajes.length === 0 || cargandoAnteriores) return;
    const contenedor = scrollRef.current;
    const scrollHeightAntes = contenedor?.scrollHeight ?? 0;
    setCargandoAnteriores(true);
    try {
      const anteriores = await mensajeChatService.getHilo(idClienteActivo, { beforeId: mensajes[0].id_mensaje });
      setHayMasAnteriores(anteriores.length >= LIMITE_HISTORIAL);
      if (anteriores.length > 0) {
        setMensajes((prev) => [...anteriores, ...prev]);
        requestAnimationFrame(() => {
          if (contenedor) contenedor.scrollTop = contenedor.scrollHeight - scrollHeightAntes;
        });
      }
    } catch {
      // se puede reintentar con el mismo botón
    } finally {
      setCargandoAnteriores(false);
    }
  };

  const limpiarArchivo = () => {
    setArchivo(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const excedeLimite = texto.length > MENSAJE_CONTENIDO_MAX_LENGTH;

  const enviar = async () => {
    if (idClienteActivo == null || (!texto.trim() && !archivo) || excedeLimite) return;
    setEnviando(true);
    try {
      const nuevo = await mensajeChatService.enviarComoAdmin(
        idClienteActivo,
        texto.trim() || undefined,
        archivo ?? undefined,
        idReservaSeleccionada ?? undefined,
      );
      setMensajes((prev) => [...prev, nuevo]);
      setTexto("");
      limpiarArchivo();
      cargarHilos(false);
    } catch {
      // el texto/archivo quedan como estaban para que el admin pueda reintentar
    } finally {
      setEnviando(false);
    }
  };

  const hiloActivo = useMemo(
    () => hilos.find((h) => h.id_cliente === idClienteActivo) ?? null,
    [hilos, idClienteActivo],
  );

  // Respaldo cuando se entra a un hilo sin mensajes todavía (deep-link
  // desde "Ver mensajes" en Clientes) -- hiloActivo viene vacío porque ese
  // cliente todavía no aparece en la bandeja (no existe hilo hasta el
  // primer mensaje).
  const clienteFallback = useMemo(
    () => (idClienteActivo != null ? (clientes.find((c) => c.id_cliente === idClienteActivo) ?? null) : null),
    [clientes, idClienteActivo],
  );
  const nombreActivo = hiloActivo?.cliente_nombre ?? (clienteFallback ? `${clienteFallback.nombre} ${clienteFallback.apellido}` : "Cliente");
  const fotoActiva = hiloActivo?.cliente_foto ?? clienteFallback?.foto_perfil ?? null;

  const reservasDelClienteActivo = useMemo(
    () => reservas.filter((r) => r.id_cliente === idClienteActivo),
    [reservas, idClienteActivo],
  );

  const reservasFiltradas = useMemo(() => {
    const q = busquedaReserva.trim().toLowerCase();
    if (!q) return reservasDelClienteActivo;
    return reservasDelClienteActivo.filter((r) => {
      const texto = `${r.hotel_nombre ?? ""} ${r.destino ?? ""} #${r.id_reserva} ${r.estado ?? ""}`.toLowerCase();
      return texto.includes(q);
    });
  }, [reservasDelClienteActivo, busquedaReserva]);

  const formatFechaCorta = (iso?: string | null) =>
    iso ? new Date(iso).toLocaleDateString("es-CO", { day: "2-digit", month: "2-digit", year: "numeric" }) : "";

  const copiarInfo = (texto: string, campo: string) => {
    navigator.clipboard
      .writeText(texto)
      .then(() => {
        setCampoCopiado(campo);
        setTimeout(() => setCampoCopiado((actual) => (actual === campo ? null : actual)), 1500);
      })
      .catch(() => {});
  };

  const textoInfoClienteCompleta = clienteFallback
    ? [
        nombreActivo,
        `Cédula: ${clienteFallback.cedula}`,
        `Teléfono: ${clienteFallback.celular}`,
        `Correo: ${clienteFallback.correo}`,
        clienteFallback.direccion ? `Dirección: ${clienteFallback.direccion}` : null,
        reservasDelClienteActivo.length > 0
          ? [
              "Reservas:",
              ...reservasDelClienteActivo.map(
                (r) =>
                  `- #${r.id_reserva} ${r.hotel_nombre || r.destino || ""} · ${formatFechaCorta(r.fecha_inicio)} a ${formatFechaCorta(r.fecha_fin)} · ${r.estado}`,
              ),
            ].join("\n")
          : null,
      ]
        .filter(Boolean)
        .join("\n")
    : "";

  return (
    <div>
      <SectionHeader
        title="Mensajes"
        subtitle="Conversaciones privadas con tus clientes -- cualquier administrador puede ver y responder cualquier hilo."
      />

      <div className="mt-5 grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 h-[calc(100vh-220px)] min-h-[480px]">
        {/* ── Bandeja de hilos ── */}
        <div className={panelCls}>
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Buscar por nombre o correo..."
                className="w-full pl-8 pr-3 py-2 text-xs bg-muted/40 border border-border rounded-lg text-foreground placeholder:text-muted-foreground/60 outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>
          <div className="overflow-y-auto flex-1">
            {hilosLoading ? (
              <p className="p-6 text-sm text-muted-foreground text-center">Cargando conversaciones...</p>
            ) : hilos.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  icon={MessageCircle}
                  title="Sin conversaciones todavía"
                  description={
                    searchHilos
                      ? "Ningún cliente coincide con esa búsqueda."
                      : "Los mensajes que te escriban tus clientes aparecerán aquí."
                  }
                />
              </div>
            ) : (
              <>
                {hilos.map((h) => (
                  <button
                    key={h.id_cliente}
                    onClick={() => setIdClienteActivo(h.id_cliente)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left border-b border-border transition-colors ${
                      idClienteActivo === h.id_cliente ? "bg-primary/10" : "hover:bg-muted"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                      {h.cliente_foto ? (
                        <img src={resolveFotoUrl(h.cliente_foto)} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm font-bold text-muted-foreground">
                          {h.cliente_nombre[0]?.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{h.cliente_nombre}</p>
                      <p className="text-xs text-muted-foreground truncate">{h.ultimo_mensaje ?? "Sin mensajes"}</p>
                    </div>
                    {h.no_leidos > 0 && (
                      <span className="flex-shrink-0 min-w-[20px] h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[11px] font-bold flex items-center justify-center">
                        {h.no_leidos}
                      </span>
                    )}
                  </button>
                ))}
                {hilos.length < totalHilos && (
                  <div className="p-3 flex justify-center">
                    <button
                      onClick={() => cargarHilos(true)}
                      disabled={hilosLoadingMore}
                      className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                    >
                      {hilosLoadingMore ? "Cargando..." : `Cargar más (${hilos.length}/${totalHilos})`}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* ── Conversación ── */}
        <div className={panelCls}>
          {idClienteActivo == null ? (
            <div className="flex-1 flex items-center justify-center p-6">
              <EmptyState
                icon={MessageCircle}
                title="Elige una conversación"
                description="Selecciona un cliente de la lista para ver y responder su hilo."
              />
            </div>
          ) : (
            <>
              <div className="relative px-5 py-3 border-b border-border flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                  {fotoActiva ? (
                    <img src={resolveFotoUrl(fotoActiva)} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs font-bold text-muted-foreground">{nombreActivo[0]?.toUpperCase()}</span>
                  )}
                </div>
                <p className="text-sm font-semibold text-foreground">{nombreActivo}</p>
                {clienteFallback && (
                  <button
                    type="button"
                    onClick={() => setInfoClienteAbierta((v) => !v)}
                    className={`p-1.5 rounded-full transition-colors ${
                      infoClienteAbierta ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                    title="Ver información del cliente"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                )}

                {infoClienteAbierta && clienteFallback && (
                  <div className="fixed inset-0 z-40" onClick={() => setInfoClienteAbierta(false)} />
                )}
                <AnimatePresence>
                  {infoClienteAbierta && clienteFallback && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      onClick={(e) => e.stopPropagation()}
                      className="absolute left-5 top-full mt-1.5 z-50 w-72 rounded-xl border border-border bg-card shadow-lg p-3.5"
                    >
                      <div className="flex items-center justify-between mb-2.5">
                        <p className="text-xs font-semibold text-foreground">Información del cliente</p>
                        <button
                          type="button"
                          onClick={() => setInfoClienteAbierta(false)}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="space-y-1.5">
                        <CampoInfoCliente
                          icon={CreditCard}
                          label="Cédula"
                          valor={clienteFallback.cedula}
                          copiado={campoCopiado === "cedula"}
                          onCopiar={() => copiarInfo(clienteFallback.cedula, "cedula")}
                        />
                        <CampoInfoCliente
                          icon={Phone}
                          label="Teléfono"
                          valor={clienteFallback.celular}
                          copiado={campoCopiado === "celular"}
                          onCopiar={() => copiarInfo(clienteFallback.celular, "celular")}
                        />
                        <CampoInfoCliente
                          icon={Mail}
                          label="Correo"
                          valor={clienteFallback.correo}
                          copiado={campoCopiado === "correo"}
                          onCopiar={() => copiarInfo(clienteFallback.correo, "correo")}
                        />
                        {clienteFallback.direccion && (
                          <CampoInfoCliente
                            icon={MapPin}
                            label="Dirección"
                            valor={clienteFallback.direccion}
                            copiado={campoCopiado === "direccion"}
                            onCopiar={() => copiarInfo(clienteFallback.direccion ?? "", "direccion")}
                          />
                        )}
                      </div>

                      {reservasDelClienteActivo.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-border/60">
                          <p className="text-[11px] font-medium text-muted-foreground mb-1.5">
                            Reservas ({reservasDelClienteActivo.length})
                          </p>
                          <div className="space-y-1 max-h-32 overflow-y-auto">
                            {reservasDelClienteActivo.map((r) => (
                              <div key={r.id_reserva} className="flex items-center justify-between gap-2 text-xs">
                                <button
                                  type="button"
                                  onClick={() => onVerReserva?.(r.id_reserva)}
                                  disabled={!onVerReserva}
                                  title={`${r.hotel_nombre || r.destino || "Reserva"} · #${r.id_reserva}`}
                                  className={`text-left truncate text-foreground ${onVerReserva ? "hover:underline cursor-pointer" : ""}`}
                                >
                                  #{r.id_reserva} · {r.hotel_nombre || r.destino || "—"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    copiarInfo(
                                      `Reserva #${r.id_reserva} · ${r.hotel_nombre || r.destino || ""} · ${formatFechaCorta(r.fecha_inicio)} a ${formatFechaCorta(r.fecha_fin)} · ${r.estado}`,
                                      `reserva-${r.id_reserva}`,
                                    )
                                  }
                                  className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                  {campoCopiado === `reserva-${r.id_reserva}` ? (
                                    <Check className="w-3 h-3 text-green-600" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => copiarInfo(textoInfoClienteCompleta, "todo")}
                        className="mt-3 w-full flex items-center justify-center gap-1.5 text-xs font-medium bg-primary/10 text-primary rounded-lg py-1.5 hover:bg-primary/15 transition-colors"
                      >
                        {campoCopiado === "todo" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {campoCopiado === "todo" ? "Copiado" : "Copiar toda la información"}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                {mensajesLoading ? (
                  <p className="text-sm text-muted-foreground text-center">Cargando conversación...</p>
                ) : mensajes.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center">Todavía no hay mensajes en este hilo.</p>
                ) : (
                  <>
                    {hayMasAnteriores && (
                      <div className="flex justify-center pb-1">
                        <button
                          onClick={cargarAnteriores}
                          disabled={cargandoAnteriores}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                          {cargandoAnteriores ? "Cargando..." : "Cargar mensajes anteriores"}
                        </button>
                      </div>
                    )}
                    {mensajes.map((m) => (
                      <div key={m.id_mensaje} className={`flex ${m.remitente_tipo === "admin" ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 ${
                            m.remitente_tipo === "admin" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                          }`}
                        >
                          {m.reserva && (
                            <button
                              type="button"
                              onClick={() => onVerReserva?.(m.reserva!.id_reserva)}
                              disabled={!onVerReserva}
                              className={`inline-flex items-center gap-1 text-[10px] font-semibold mb-1.5 px-1.5 py-0.5 rounded-full ${
                                m.remitente_tipo === "admin"
                                  ? "bg-primary-foreground/15 text-primary-foreground"
                                  : "bg-primary/10 text-primary"
                              } ${onVerReserva ? "hover:underline cursor-pointer" : "cursor-default"}`}
                            >
                              <CalendarDays className="w-3 h-3" />
                              {m.reserva.nombre_paquete || m.reserva.hotel_nombre || `Reserva #${m.reserva.id_reserva}`}
                            </button>
                          )}
                          {m.imagen_url && (
                            <img
                              src={resolveFotoUrl(m.imagen_url)}
                              alt="Captura enviada"
                              className="rounded-lg mb-1.5 max-h-56 object-cover cursor-pointer"
                              onClick={() => setImagenAmpliada(resolveFotoUrl(m.imagen_url))}
                            />
                          )}
                          {m.archivo_url && (
                            <a
                              href={resolveFotoUrl(m.archivo_url)}
                              target="_blank"
                              rel="noopener noreferrer"
                              download={m.archivo_nombre ?? undefined}
                              className={`flex items-center gap-2 mb-1.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                                m.remitente_tipo === "admin"
                                  ? "bg-primary-foreground/15 text-primary-foreground hover:bg-primary-foreground/25"
                                  : "bg-background text-foreground hover:bg-muted"
                              }`}
                            >
                              <FileText className="w-4 h-4 flex-shrink-0" />
                              <span className="truncate flex-1">{m.archivo_nombre || "Documento"}</span>
                              <Download className="w-3.5 h-3.5 flex-shrink-0 opacity-70" />
                            </a>
                          )}
                          {m.contenido && <p className="text-sm whitespace-pre-wrap break-words">{m.contenido}</p>}
                          <p
                            className={`text-[10px] mt-1 ${
                              m.remitente_tipo === "admin" ? "text-primary-foreground/70" : "text-muted-foreground"
                            }`}
                          >
                            {m.fecha_envio
                              ? new Date(m.fecha_envio).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })
                              : ""}
                          </p>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>

              {reservasDelClienteActivo.length > 0 && (
                <div className="px-5 pt-2.5 flex items-center gap-2 flex-wrap border-t border-border/60">
                  <span className="text-[11px] text-muted-foreground">¿De qué reserva hablas? (opcional)</span>
                  {reservasDelClienteActivo.length > 3 && (
                    <input
                      type="text"
                      value={busquedaReserva}
                      onChange={(e) => setBusquedaReserva(e.target.value)}
                      placeholder="Buscar..."
                      className="text-xs bg-muted/40 border border-border rounded-lg px-2 py-1 text-foreground outline-none focus:ring-2 focus:ring-primary/40 w-24"
                    />
                  )}
                  <select
                    value={idReservaSeleccionada ?? ""}
                    onChange={(e) => setIdReservaSeleccionada(e.target.value ? Number(e.target.value) : null)}
                    className="text-xs bg-muted/40 border border-border rounded-lg px-2 py-1 text-foreground outline-none focus:ring-2 focus:ring-primary/40 max-w-[220px]"
                  >
                    <option value="">Ninguna reserva en particular</option>
                    {reservasFiltradas.map((r) => (
                      <option key={r.id_reserva} value={r.id_reserva}>
                        {r.hotel_nombre || r.destino || `Reserva #${r.id_reserva}`} · #{r.id_reserva}
                      </option>
                    ))}
                    {reservasFiltradas.length === 0 && <option value="">Sin resultados</option>}
                  </select>
                  {idReservaSeleccionada != null && (
                    <button
                      type="button"
                      onClick={() => setIdReservaSeleccionada(null)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                      title="Quitar reserva"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}

              {imagen && (
                <div className="px-5 pt-2 flex items-center gap-2">
                  <span className="text-xs text-muted-foreground truncate">{imagen.name}</span>
                  <button onClick={limpiarImagen} className="text-muted-foreground hover:text-destructive transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="px-5 py-3 border-t border-border flex items-end gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setImagen(e.target.files?.[0] ?? null)}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2.5 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors flex-shrink-0"
                  title="Adjuntar captura"
                  type="button"
                >
                  <ImageIcon className="w-4 h-4" />
                </button>
                <div className="flex-1 flex flex-col gap-1">
                  <textarea
                    value={texto}
                    onChange={(e) => setTexto(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        enviar();
                      }
                    }}
                    placeholder="Escribe un mensaje..."
                    rows={1}
                    className={`${inputCls} resize-none w-full`}
                  />
                  {texto.length > MENSAJE_CONTENIDO_MAX_LENGTH * 0.8 && (
                    <span className={`text-[10px] self-end ${excedeLimite ? "text-destructive font-semibold" : "text-muted-foreground"}`}>
                      {texto.length}/{MENSAJE_CONTENIDO_MAX_LENGTH}
                    </span>
                  )}
                </div>
                <button
                  onClick={enviar}
                  disabled={enviando || excedeLimite || (!texto.trim() && !imagen)}
                  className="p-2.5 rounded-xl bg-primary text-primary-foreground disabled:opacity-40 transition-all flex-shrink-0"
                  title="Enviar"
                  type="button"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <AnimatePresence>
        {imagenAmpliada && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-6 cursor-zoom-out"
            onClick={() => setImagenAmpliada(undefined)}
          >
            <img src={imagenAmpliada} alt="Captura ampliada" className="max-w-full max-h-full rounded-lg" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CampoInfoCliente({
  icon: Icon,
  label,
  valor,
  copiado,
  onCopiar,
}: {
  icon: LucideIcon;
  label: string;
  valor: string;
  copiado: boolean;
  onCopiar: () => void;
}) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <Icon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
      <span className="text-muted-foreground flex-shrink-0">{label}:</span>
      <span className="text-foreground truncate flex-1">{valor}</span>
      <button
        type="button"
        onClick={onCopiar}
        className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
      >
        {copiado ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
      </button>
    </div>
  );
}
