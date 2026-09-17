import { useEffect, useState } from "react";
import { isRouteErrorResponse, useRouteError } from "react-router";
import { AlertTriangle, RefreshCw } from "lucide-react";

// Detecta el error clásico de code-splitting con Vite justo después de un
// deploy: el navegador tenía cargado un index.html de ANTES del último
// build y pide un chunk (ej. "Admindashboard-xxxx.js") que el deploy nuevo
// ya no sirve con ese nombre exacto. Un solo reload trae el index.html
// actual con las referencias correctas -- si después de recargar el error
// sigue igual, ya no es un chunk viejo sino un problema real, así que no
// reintentamos en loop (la bandera en sessionStorage se limpia sola).
const CHUNK_ERROR_PATTERN =
  /failed to fetch dynamically imported module|error loading dynamically imported module|importing a module script failed/i;
const RELOAD_FLAG = "chunk-reload-attempted";

function getErrorMessage(error: unknown): string {
  if (isRouteErrorResponse(error)) return error.statusText || `Error ${error.status}`;
  if (error instanceof Error) return error.message;
  return String(error);
}

// errorElement de la ruta raíz (ver routes.tsx) -- reemplaza la pantalla
// genérica de React Router ("💿 Hey developer...") por algo presentable
// para un cliente real, y maneja aparte el caso de chunk viejo con un
// reload automático en vez de mostrar un error que en realidad se arregla
// solo con refrescar.
export default function RouteErrorBoundary() {
  const error = useRouteError();
  const message = getErrorMessage(error);
  const isChunkError = CHUNK_ERROR_PATTERN.test(message);
  const [reloading, setReloading] = useState(false);

  useEffect(() => {
    if (!isChunkError) return;
    const yaIntento = sessionStorage.getItem(RELOAD_FLAG) === "1";
    if (!yaIntento) {
      sessionStorage.setItem(RELOAD_FLAG, "1");
      setReloading(true);
      window.location.reload();
    } else {
      sessionStorage.removeItem(RELOAD_FLAG);
    }
  }, [isChunkError]);

  if (reloading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background px-6 text-center">
      <div className="rounded-full bg-primary/10 p-4">
        <AlertTriangle className="h-10 w-10 text-primary" />
      </div>

      <h1 className="mt-6 text-3xl md:text-4xl font-bold text-foreground">
        Algo salió mal
      </h1>
      <p className="mt-4 max-w-sm text-muted-foreground">
        {isChunkError
          ? "Parece que la página se actualizó mientras la tenías abierta. Recárgala para seguir donde estabas."
          : "Tuvimos un problema inesperado cargando esta página. Intenta recargar; si sigue pasando, cuéntanos qué estabas haciendo."}
      </p>

      <div className="mt-10 flex flex-col sm:flex-row gap-4">
        <button
          onClick={() => window.location.reload()}
          className="group relative inline-flex h-12 items-center justify-center gap-2 overflow-hidden rounded-full bg-primary px-8 font-medium text-primary-foreground transition-all hover:scale-105 active:scale-95"
        >
          <RefreshCw className="h-4 w-4" />
          Recargar página
        </button>
        <a
          href="/"
          className="inline-flex h-12 items-center justify-center rounded-full border border-primary/50 bg-transparent px-8 font-medium text-foreground transition-all hover:bg-primary/10 hover:border-primary active:scale-95"
        >
          Volver a casa
        </a>
      </div>
    </div>
  );
}
