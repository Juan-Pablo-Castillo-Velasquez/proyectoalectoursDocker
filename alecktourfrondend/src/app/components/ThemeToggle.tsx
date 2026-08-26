import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
    const [isDark, setIsDark] = useState(false);

    // Al cargar, priorizamos lo guardado en localStorage; si no hay nada, usamos preferencia del sistema
    useEffect(() => {
        const stored = localStorage.getItem("theme");
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        const shouldBeDark = stored ? stored === "dark" : prefersDark;

        document.documentElement.classList.toggle("dark", shouldBeDark);
        setIsDark(shouldBeDark);
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