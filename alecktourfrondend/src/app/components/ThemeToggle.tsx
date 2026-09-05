import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { sincronizarThemeColorMeta } from "../context/TemaContext";

export function ThemeToggle() {
    const [isDark, setIsDark] = useState(false);

    // Al cargar, priorizamos lo guardado en localStorage; si no hay nada, usamos preferencia del sistema
    useEffect(() => {
        const stored = localStorage.getItem("theme");
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        const shouldBeDark = stored ? stored === "dark" : prefersDark;

        document.documentElement.classList.toggle("dark", shouldBeDark);
        setIsDark(shouldBeDark);
        // El <meta name="theme-color"> depende de --primary, que cambia
        // entre claro/oscuro (ver theme.css) -- sincronizarlo también acá
        // y no solo al activar un tema de temporada (TemaContext.tsx),
        // para que el color de la barra del sistema sea correcto desde el
        // primer render, sin esperar a un cambio de tema.
        sincronizarThemeColorMeta();
    }, []);

    const toggleTheme = () => {
        if (isDark) {
            document.documentElement.classList.remove("dark");
            localStorage.setItem("theme", "light");
            setIsDark(false);
        } else {
            document.documentElement.classList.add("dark");
            localStorage.setItem("theme", "dark");
            setIsDark(true);
        }
        sincronizarThemeColorMeta();
    };

    return (
        <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-accent transition-colors text-foreground"
            aria-label="Cambiar tema"
        >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
    );
}