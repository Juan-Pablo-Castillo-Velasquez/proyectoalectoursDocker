import { useEffect, useRef, useState } from "react";
import { Image as ImageIcon, Loader2, MessageCircle, Send, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { resolveFotoUrl, inputCls } from "../admin/types";
import { mensajeChatService, type MensajeChat } from "../../services/mensajeChat.service";

// Chat privado con el equipo de AlecTours -- un solo hilo continuo (no uno
// por reserva); cualquier admin puede responder. Solo polling cada 5s
// (sin websockets, mismo criterio que ModuleMensajes.tsx del panel admin).
const POLL_MENSAJES_MS = 5000;

export default function TabMensajes() {
  const [mensajes, setMensajes] = useState<MensajeChat[]>([]);
  const [loading, setLoading] = useState(true);
  const [texto, setTexto] = useState("");
  const [imagen, setImagen] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [imagenAmpliada, setImagenAmpliada] = useState<string | undefined>(undefined);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mensajesRef = useRef<MensajeChat[]>([]);
  mensajesRef.current = mensajes;

  useEffect(() => {
    mensajeChatService
      .getMiHilo()
      .then(setMensajes)
      .catch(console.error)
      .finally(() => setLoading(false));
    // Abrir la pestaña ya cuenta como "leer" los mensajes del admin.
    mensajeChatService.marcarLeido().catch(() => {});
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      const actuales = mensajesRef.current;
      const ultimoId = actuales.length ? actuales[actuales.length - 1].id_mensaje : undefined;
      try {
        const nuevos = await mensajeChatService.getMiHilo(ultimoId);
        if (nuevos.length > 0) {
          setMensajes((prev) => [...prev, ...nuevos]);
          if (nuevos.some((m) => m.remitente_tipo === "admin")) {
            mensajeChatService.marcarLeido().catch(() => {});
          }
        }
      } catch {
        /* se reintenta en el próximo ciclo */
      }
    }, POLL_MENSAJES_MS);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [mensajes.length]);

  const limpiarImagen = () => {
    setImagen(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const enviar = async () => {
    if (!texto.trim() && !imagen) return;
    setEnviando(true);
    try {
      const nuevo = await mensajeChatService.enviarComoCliente(texto.trim() || undefined, imagen ?? undefined);
      setMensajes((prev) => [...prev, nuevo]);
      setTexto("");
      limpiarImagen();
    } catch {
      // el texto/imagen quedan como estaban para poder reintentar
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground tracking-tight">Mensajes</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Escríbele directo a nuestro equipo -- por aquí puedes hablar de tus reservas o enviar capturas de pantalla.
        </p>
      </div>

      <div className="bg-card text-card-foreground border border-border rounded-xl shadow-sm overflow-hidden flex flex-col h-[calc(100vh-320px)] min-h-[420px]">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Cargando tu conversación...</p>
          </div>
        ) : (
          <>
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {mensajes.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <MessageCircle className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
                  <h3 className="text-base font-bold text-foreground tracking-tight">Aún no tienes mensajes</h3>
                  <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-1">
                    Escríbenos si tienes dudas sobre alguna reserva -- te responderá el equipo de AlecTours.
                  </p>
                </div>
              ) : (
                mensajes.map((m) => (
                  <div key={m.id_mensaje} className={`flex ${m.remitente_tipo === "cliente" ? "justify-end" : "justify-start"}`}>
                    <div className="max-w-[80%] sm:max-w-[70%] flex flex-col gap-1">
                      {m.remitente_tipo === "admin" && (
                        <span className="text-[11px] text-muted-foreground px-1">{m.remitente_nombre ?? "AlecTours"}</span>
                      )}
                      <div
                        className={`rounded-2xl px-3.5 py-2.5 ${
                          m.remitente_tipo === "cliente"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-foreground"
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
                            m.remitente_tipo === "cliente" ? "text-primary-foreground/70" : "text-muted-foreground"
                          }`}
                        >
                          {m.fecha_envio
                            ? new Date(m.fecha_envio).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })
                            : ""}
                        </p>
                      </div>
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
