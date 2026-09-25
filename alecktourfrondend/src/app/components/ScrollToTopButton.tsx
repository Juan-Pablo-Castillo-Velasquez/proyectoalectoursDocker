import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

// Brief (Home): "una flecha por si baja hasta abajo para volver arriba en
// el home asi el usuario no se pierde" -- aparece solo después de bajar un
// poco (no tiene sentido antes: en la parte de arriba ya está "arriba"),
// para no competir con el botón de "Hablar con un asesor" (WhatsAppButton,
// fixed bottom-5 right-5 en RootLayout) se ancla en la esquina opuesta.
const UMBRAL_SCROLL_PX = 480;

export default function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > UMBRAL_SCROLL_PX);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      title="Volver arriba"
      aria-label="Volver arriba"
      className="fixed bottom-5 left-5 z-50 flex items-center justify-center w-11 h-11 rounded-full bg-card border border-border text-foreground shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
    >
      <ArrowUp className="w-5 h-5" />
    </button>
  );
}
