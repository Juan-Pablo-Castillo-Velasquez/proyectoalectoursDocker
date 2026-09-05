import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { Tema, temaService } from "../services/tema.service";

interface TemaContextType {
  temaActivo: Tema | null;
  /** Llamar después de crear/editar/activar/eliminar un tema desde
   * ModuleTemas.tsx para que el sitio en vivo (navbar, botones, footer)
   * refleje el cambio sin necesitar un refresh completo de la página. */
  refrescarTemaActivo: () => Promise<void>;
}

const TemaContext = createContext<TemaContextType | null>(null);

const STYLE_TAG_ID = "tema-temporada-runtime";
const ATTR = "data-tema-temporada";

function hexToRgb(hex: string): string {
  const limpio = hex.replace("#", "");
  const r = parseInt(limpio.substring(0, 2), 16);
  const g = parseInt(limpio.substring(2, 4), 16);
  const b = parseInt(limpio.substring(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

// Recolorea TODO el sitio (navbar, botones, footer, hero, sidebar admin)
// según el tema de temporada activo, sin tocar layout ni fondos/textos
// base -- ver theme.css ("TOKENS DERIVADOS PARA TEMAS DE TEMPORADA") para
// por qué basta con redefinir --primary/--gold/-rgb. Usa el mismo patrón
// [data-x] + .dark[data-x] que ya usa el propio :root/.dark del proyecto
// para claro/oscuro, así que respeta el modo claro/oscuro del visitante
// (ver ThemeToggle.tsx, que alterna la clase .dark en <html>).
function aplicarTemaEnDOM(tema: Tema | null): void {
  const root = document.documentElement;

  // El tema "Marca" (predeterminado) no necesita ningún override: los
  // valores base de theme.css YA son sus colores -- sin tema activo, o
  // si el activo es el predeterminado, el sitio queda exactamente igual
  // que hoy (conservando el color actual, como se pidió).
  if (!tema || tema.es_predeterminado) {
    root.removeAttribute(ATTR);
    document.getElementById(STYLE_TAG_ID)?.remove();
    return;
  }

  root.setAttribute(ATTR, tema.clave);

  let styleTag = document.getElementById(STYLE_TAG_ID) as HTMLStyleElement | null;
  if (!styleTag) {
    styleTag = document.createElement("style");
    styleTag.id = STYLE_TAG_ID;
    document.head.appendChild(styleTag);
  }

  const selector = `[${ATTR}="${tema.clave}"]`;
  styleTag.textContent = `
${selector} {
  --primary: ${tema.color_primario_claro};
  --primary-rgb: ${hexToRgb(tema.color_primario_claro)};
  --gold: ${tema.color_secundario_claro};
  --gold-rgb: ${hexToRgb(tema.color_secundario_claro)};
  --gold-surface: ${tema.color_secundario_oscuro};
  --gold-surface-rgb: ${hexToRgb(tema.color_secundario_oscuro)};
}
.dark${selector} {
  --primary: ${tema.color_primario_oscuro};
  --primary-rgb: ${hexToRgb(tema.color_primario_oscuro)};
  --gold: ${tema.color_secundario_oscuro};
  --gold-rgb: ${hexToRgb(tema.color_secundario_oscuro)};
}

/* Navbar con más presencia mientras este tema de temporada está activo
   -- mismo --primary-rgb de arriba, solo con opacidad mayor que la base
   de .navbar-surface (theme.css) para que se note el cambio de un
   vistazo, sin tocar layout ni el resto de la paleta. */
${selector} .navbar-surface {
  background: linear-gradient(
    180deg,
    rgba(var(--primary-rgb), 0.22) 0%,
    rgba(255, 255, 255, 0.94) 78%
  );
  border-bottom-color: rgba(var(--primary-rgb), 0.3);
}
.dark${selector} .navbar-surface {
  background: linear-gradient(
    180deg,
    rgba(var(--primary-rgb), 0.3) 0%,
    rgba(15, 15, 16, 0.95) 78%
  );
  border-bottom-color: rgba(var(--primary-rgb), 0.36);
}
${selector} .navbar-surface::before {
  height: 5px;
  box-shadow: 0 2px 12px rgba(var(--primary-rgb), 0.55);
}
`.trim();
}

export function TemaProvider({ children }: { children: ReactNode }) {
  const [temaActivo, setTemaActivo] = useState<Tema | null>(null);

  const refrescarTemaActivo = useCallback(async () => {
    try {
      const tema = await temaService.getActivo();
      setTemaActivo(tema);
      aplicarTemaEnDOM(tema);
    } catch {
      // Sin ningún tema configurado todavía, o backend no disponible en
      // este momento (ej. arrancando) -- el sitio se queda con los
      // colores de marca de theme.css tal cual, nunca se rompe por esto.
      setTemaActivo(null);
      aplicarTemaEnDOM(null);
    }
  }, []);

  useEffect(() => {
    refrescarTemaActivo();
  }, [refrescarTemaActivo]);

  return (
    <TemaContext.Provider value={{ temaActivo, refrescarTemaActivo }}>
      {children}
    </TemaContext.Provider>
  );
}

export function useTema(): TemaContextType {
  const ctx = useContext(TemaContext);
  if (!ctx) throw new Error("useTema debe usarse dentro de <TemaProvider>");
  return ctx;
}
