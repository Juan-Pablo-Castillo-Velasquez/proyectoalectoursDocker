import { useEffect, useMemo, useRef, useState } from "react";
import { Image as ImageIcon, MessageCircle, Send, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import EmptyState from "./ui/EmptyState";
import SectionHeader from "./ui/SectionHeader";
import { inputCls, resolveFotoUrl } from "./types";
import { mensajeChatService, type HiloResumen, type MensajeChat } from "../../services/mensajeChat.service";

// Chat privado admin<->cliente -- bandeja compartida (cualquier admin ve y
// responde cualquier hilo) y un solo hilo continuo por cliente (no uno por
// reserva). Solo polling, sin websockets -- ver el comentario de
// mensaje_chat_route.py: el backend está en el plan free de Render, que
// duerme tras 15 min de inactividad y mataría cualquier socket abierto.
const POLL_HILOS_MS = 9000;
const POLL_MENSAJES_MS = 5000;

// Mismos tokens visuales que cardCls (types.ts) pero sin su padding fijo
// -- este panel necesita p-0 para que la lista/el chat lleguen al borde.
const panelCls = "bg-card rounded-2xl shadow-sm border border-border overflow-hidden flex flex-col";

export default function ModuleMensajes() {
  const [hilos, setHilos] = useState<HiloResumen[]>([]);
  const [hilosLoading, setHilosLoading] = useState(true);
  const [idClienteActivo, setIdClienteActivo] = useState<number | null>(null);
  const [mensajes, setMensajes] = useState<MensajeChat[]>([]);
  const [mensajesLoading, setMensajesLoading] = useState(false);
  const [texto, setTexto] = useState("");
  const [imagen, setImagen] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [imagenAmpliada, setImagenAmpliada] = useState<string | undefined>(undefined);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mensajesRef = useRef<MensajeChat[]>([]);
  mensajesRef.current = mensajes;

  const cargarHilos = () =>
    mensajeChatService
      .getHilos()
      .then(setHilos)
      .catch(() => {
        /* no crítico -- el próximo ciclo de polling reintenta */
      });

  useEffect(() => {
    cargarHilos().finally(() => setHilosLoading(false));
    const interval = setInterval(cargarHilos, POLL_HILOS_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Carga completa del hilo al seleccionar un cliente -- y marca como
  // leídos sus mensajes de una vez (equivalente a "abrir la conversación").
  useEffect(() => {
    if (idClienteActivo == null) return;
    let vivo = true;
    setMensajesLoading(true);
    mensajeChatService
      .getHilo(idClienteActivo)
      .then((data) => {
        if (vivo) setMensajes(data);
      })
      .catch(() => {})
      .finally(() => {
        if (vivo) setMensajesLoading(false);
      });
    mensajeChatService.marcarLeido(idClienteActivo).then(cargarHilos).catch(() => {});
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
        const nuevos = await mensajeChatService.getHilo(idClienteActivo, ultimoId);
        if (nuevos.length > 0) {
          setMensajes((prev) => [...prev, ...nuevos]);
          if (nuevos.some((m) => m.remitente_tipo === "cliente")) {
            mensajeChatService.marcarLeido(idClienteActivo).then(cargarHilos).catch(() => {});
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

  const limpiarImagen = () => {
    setImagen(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const enviar = async () => {
    if (idClienteActivo == null || (!texto.trim() && !imagen)) return;
    setEnviando(true);
    try {
      const nuevo = await mensajeChatService.enviarComoAdmin(idClienteActivo, texto.trim() || undefined, imagen ?? undefined);
      setMensajes((prev) => [...prev, nuevo]);
      setTexto("");
      limpiarImagen();
      cargarHilos();
    } catch {
      // el texto/imagen quedan como estaban para que el admin pueda reintentar
    } finally {
      setEnviando(false);
    }
  };

  const hiloActivo = useMemo(
    () => hilos.find((h) => h.id_cliente === idClienteActivo) ?? null,
    [hilos, idClienteActivo],
  );

  return (
    <div>
      <SectionHeader
        title="Mensajes"
        subtitle="Conversaciones privadas con tus clientes -- cualquier administrador puede ver y responder cualquier hilo."
      />

      <div className="mt-5 grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 h-[calc(100vh-220px)] min-h-[480px]">
        {/* ── Bandeja de hilos ── */}
        <div className={panelCls}>
          <div className="overflow-y-auto flex-1">
            {hilosLoading ? (
              <p className="p-6 text-sm text-muted-foreground text-center">Cargando conversaciones...</p>
            ) : hilos.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  icon={MessageCircle}
                  title="Sin conversaciones todavía"
                  description="Los mensajes que te escriban tus clientes aparecerán aquí."
                />
              </div>
            ) : (
              hilos.map((h) => (
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
              ))
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
              <div className="px-5 py-3 border-b border-border flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                  {hiloActivo?.cliente_foto ? (
                    <img src={resolveFotoUrl(hiloActivo.cliente_foto)} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs font-bold text-muted-foreground">
                      {hiloActivo?.cliente_nombre?.[0]?.toUpperCase()}
                    </span>
                  )}
                </div>
                <p className="text-sm font-semibold text-foreground">{hiloActivo?.cliente_nombre}</p>
              </div>

              <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                {mensajesLoading ? (
                  <p className="text-sm text-muted-foreground text-center">Cargando conversación...</p>
                ) : mensajes.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center">Todavía no hay mensajes en este hilo.</p>
                ) : (
                  mensajes.map((m) => (
                    <div key={m.id_mensaje} className={`flex ${m.remitente_tipo === "admin" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 ${
                          m.remitente_tipo === "admin" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                        }`}
                      >
                        {m.imagen_url && (
                          <img
                            src={resolveFotoUrl(m.imagen_url)}
                            alt="Captura enviada"
                            className="rounded-lg mb-1.5 max-h-56 object-cover cursor-pointer"
                            onClick={() => setImagenAmpliada(resolveFotoUrl(m.imagen_url))}
                          />
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
                  ))
                )}
              </div>

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
                  className={`${inputCls} resize-none flex-1`}
                />
                <button
                  onClick={enviar}
                  disabled={enviando || (!texto.trim() && !imagen)}
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
