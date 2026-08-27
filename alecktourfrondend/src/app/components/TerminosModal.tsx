import { useEffect } from "react";
import ModalBackdrop from "./ui/ModalBackdrop";

interface TerminosModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function TerminosModal({ isOpen, onClose }: TerminosModalProps) {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <>
            {/* ── Estilos para un Scrollbar Premium ── */}
            <style>{`
        .modal-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .modal-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .modal-scrollbar::-webkit-scrollbar-thumb {
          background-color: var(--border);
          border-radius: 10px;
        }
        .dark .modal-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(255, 255, 255, 0.15);
        }
      `}</style>

            <ModalBackdrop zIndex={200} onClick={onClose}>
                <div
                    className="bg-card text-card-foreground rounded-2xl shadow-2xl dark:shadow-[0_10px_40px_rgba(0,0,0,0.6)] w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden border border-border dark:border-white/10"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* ── Header Comercial Granate Agencia ── */}
                    <div className="relative flex items-center justify-between px-6 py-5 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground border-b border-primary-foreground/10 overflow-hidden">
                        {/* Patrón de fondo sutil para el header */}
                        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>

                        <div className="relative flex items-center gap-4">
                            <div className="bg-white/20 dark:bg-black/20 backdrop-blur-md rounded-xl p-2.5 border border-white/20 dark:border-white/10 shadow-sm">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-white font-semibold text-xl tracking-tight">Términos y Condiciones</h2>
                                <p className="text-white/80 text-xs font-medium mt-0.5">AlekTours — Última actualización: junio 2025</p>
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            className="relative bg-white/10 hover:bg-white/20 dark:bg-black/20 dark:hover:bg-black/40 text-white rounded-xl p-2 transition-all duration-200"
                            aria-label="Cerrar modal"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* ── Contenido Semántico ── */}
                    <div className="modal-scrollbar overflow-y-auto px-6 py-8 flex-1 text-sm bg-card space-y-8">
                        <Section title="1. Aceptación de los términos">
                            Al registrarte y utilizar los servicios de <strong className="text-foreground font-bold">AlekTours</strong>, aceptas cumplir con estos Términos y
                            Condiciones. Si no estás de acuerdo con alguna parte, te pedimos que no uses nuestra plataforma.
                        </Section>

                        <Section title="2. Uso del servicio">
                            AlekTours te permite buscar, comparar y reservar destinos y paquetes turísticos. El uso de la plataforma
                            está destinado exclusivamente a fines personales y no comerciales. Queda prohibido:
                            <ul className="grid grid-cols-1 gap-2 mt-4 text-muted-foreground">
                                <li className="flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary/60 mt-1.5 shrink-0"></div>
                                    <span>Usar la plataforma con fines fraudulentos o ilegales.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary/60 mt-1.5 shrink-0"></div>
                                    <span>Compartir credenciales de acceso con terceros.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary/60 mt-1.5 shrink-0"></div>
                                    <span>Reproducir o redistribuir contenido sin autorización.</span>
                                </li>
                            </ul>
                        </Section>

                        <Section title="3. Reservas y pagos">
                            Las reservas realizadas a través de AlekTours están sujetas a disponibilidad. Los precios pueden variar
                            según la temporada y disponibilidad. Al confirmar una reserva, aceptas el cargo total indicado al momento
                            del pago.
                        </Section>

                        <Section title="4. Cancelaciones y reembolsos">
                            Las políticas de cancelación varían según el proveedor del servicio. AlekTours gestionará las solicitudes
                            de cancelación, pero no garantiza reembolsos automáticos. Te recomendamos revisar las condiciones
                            específicas de cada reserva antes de confirmar.
                        </Section>

                        <Section title="5. Programa de puntos AlekTours Rewards">
                            Los puntos acumulados a través del programa de fidelidad son propiedad de AlekTours y pueden ser
                            modificados o cancelados en cualquier momento. No tienen valor monetario fuera de la plataforma y no son
                            transferibles.
                        </Section>

                        <Section title="6. Limitación de responsabilidad">
                            AlekTours actúa como intermediario entre el usuario y los proveedores de servicios turísticos. No nos
                            hacemos responsables por cancelaciones, cambios o inconvenientes causados directamente por aerolíneas,
                            hoteles u otros proveedores.
                        </Section>

                        <Section title="7. Modificaciones">
                            Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios serán notificados
                            a través de la plataforma y entrarán en vigor al momento de su publicación.
                        </Section>

                        <Section title="8. Contacto">
                            Si tienes dudas sobre estos términos, puedes contactarnos en{" "}
                            <a href="mailto:soporte@alektours.com" className="text-primary hover:text-primary/80 dark:text-primary dark:hover:text-primary/80 hover:underline font-semibold transition-colors">
                                soporte@alektours.com
                            </a>.
                        </Section>
                    </div>

                    {/* ── Footer ── */}
                    <div className="px-6 py-5 border-t border-border dark:border-white/10 flex justify-end bg-muted/40 dark:bg-white/[0.02] backdrop-blur-sm">
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-primary hover:bg-primary/90 text-white shadow-[0_4px_14px_0_rgba(123,30,58,0.39)] hover:shadow-[0_6px_20px_rgba(123,30,58,0.23)] dark:shadow-none transition-all duration-200 active:scale-95 flex items-center gap-2"
                        >
                            Aceptar y cerrar
                        </button>
                    </div>
                </div>
            </ModalBackdrop>
        </>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="space-y-2 group">
            <h3 className="font-semibold text-foreground text-base tracking-tight flex items-center gap-2">
                {title}
            </h3>
            <div className="text-muted-foreground leading-relaxed text-[14.5px]">
                {children}
            </div>
        </div>
    );
}