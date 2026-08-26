const WHATSAPP_NUMBER = "573228127104";
const WHATSAPP_MESSAGE = "Hola, quiero información sobre un viaje con AlecTours";

export default function WhatsAppButton() {
  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title="Hablar con un asesor por WhatsApp"
      className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-[#25D366] text-white pl-3 pr-4 py-3 rounded-full shadow-lg shadow-black/20 hover:scale-105 hover:shadow-xl transition-all duration-200"
    >
      <svg
        viewBox="0 0 24 24"
        className="w-6 h-6 shrink-0"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M12.04 2c-5.52 0-10 4.48-10 10 0 1.77.46 3.45 1.27 4.9L2 22l5.25-1.38a9.95 9.95 0 0 0 4.79 1.22h.01c5.52 0 10-4.48 10-10s-4.48-10-10-10zm5.86 14.3c-.25.7-1.45 1.34-2 1.42-.51.08-1.15.11-1.86-.12-.43-.13-.98-.32-1.68-.62-2.96-1.28-4.89-4.26-5.04-4.46-.15-.2-1.2-1.6-1.2-3.05 0-1.45.76-2.16 1.03-2.46.27-.3.59-.37.78-.37.2 0 .39 0 .56.01.18.01.42-.07.66.5.25.6.85 2.07.92 2.22.07.15.12.32.02.52-.1.2-.15.32-.3.5-.15.17-.31.39-.44.52-.15.15-.3.31-.13.6.17.3.76 1.25 1.63 2.02 1.12 1 2.06 1.31 2.36 1.46.3.15.48.13.65-.08.18-.2.75-.87.95-1.17.2-.3.4-.25.66-.15.27.1 1.7.8 1.99.95.3.15.49.22.56.35.08.13.08.72-.17 1.41z" />
      </svg>
      <span className="hidden sm:inline text-sm font-semibold whitespace-nowrap">
        Hablar con un asesor
      </span>
    </a>
  );
}
