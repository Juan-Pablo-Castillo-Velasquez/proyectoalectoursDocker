import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect } from "react";

interface ImageLightboxProps {
  /** Todas las fotos navegables (portada + galería, en el mismo orden que se
   * muestran en la página) -- el índice hace referencia a este arreglo. */
  images: string[];
  /** Índice de la foto abierta, o null si el lightbox está cerrado. */
  index: number | null;
  onClose: () => void;
  onIndexChange: (index: number) => void;
  alt?: string;
}

/**
 * Overlay de pantalla completa para ver una foto ampliada, con navegación
 * entre todas las fotos de la galería (flechas, teclado, contador) -- antes
 * las fotos de la ficha de hotel/paquete solo se veían en miniatura, sin
 * forma de ampliarlas. Componente genérico: no sabe nada de hoteles ni
 * paquetes, solo recibe la lista de URLs a mostrar.
 */
export default function ImageLightbox({ images, index, onClose, onIndexChange, alt = "" }: ImageLightboxProps) {
  const abierto = index !== null && images.length > 0;
  const actual = index ?? 0;

  useEffect(() => {
    if (!abierto) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") onIndexChange((actual + 1) % images.length);
      else if (e.key === "ArrowLeft") onIndexChange((actual - 1 + images.length) % images.length);
    }
    window.addEventListener("keydown", onKeyDown);

    // Bloquea el scroll del fondo mientras el lightbox está abierto, como
    // cualquier overlay de pantalla completa -- se restaura el valor previo
    // (no siempre "") por si algún otro overlay ya lo había cambiado.
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflowPrevio;
    };
  }, [abierto, actual, images.length, onClose, onIndexChange]);

  if (!abierto) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Imagen ampliada"
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute top-4 right-4 p-2.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
        aria-label="Cerrar"
      >
        <X className="w-5 h-5" />
      </button>

      {images.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onIndexChange((actual - 1 + images.length) % images.length);
          }}
          className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          aria-label="Foto anterior"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      <img
        src={images[actual]}
        alt={alt}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[88vh] max-w-[92vw] object-contain rounded-lg shadow-2xl select-none"
      />

      {images.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onIndexChange((actual + 1) % images.length);
          }}
          className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          aria-label="Foto siguiente"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      {images.length > 1 && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-medium tabular-nums">
          {actual + 1} / {images.length}
        </div>
      )}
    </div>
  );
}
