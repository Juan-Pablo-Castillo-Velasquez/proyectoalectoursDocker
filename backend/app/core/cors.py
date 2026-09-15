"""Cálculo de orígenes permitidos por CORS.

Antes vivía embebido en app/main.py, mezclado con el registro del propio
FastAPI(), Sentry, el rate limiting y el resto del cableado de la app —
main.py debería ser el lugar donde se ARMA la aplicación, no donde vive la
lógica de cada pieza. Se separa acá porque además del registro de
CORSMiddleware, app/core/error_handlers.py también necesita esta misma
lista (para el header Access-Control-Allow-Origin de su respuesta de
error) — antes de este cambio esa lógica estaba duplicada a mano.
"""

import os

# Orígenes permitidos: los de desarrollo local siempre están (para no
# romper `docker compose up` ni el `npm run dev` de nadie), más los que
# vengan de la variable de entorno CORS_ORIGINS (coma-separados) — así el
# dominio real de Vercel se agrega en el entorno de producción sin tocar
# código ni hardcodear una URL que todavía no conocemos aquí.
_CORS_ORIGINS_DEV = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8000",
]

# Vercel genera, ademas del dominio estable de produccion
# (proyectoalectours-docker.vercel.app), una URL unica por cada deploy
# (ej. proyectoalectours-docker-n0a9r12pj.vercel.app) para previews y para
# cada nuevo deploy de produccion -- sin este regex, cada una de esas URLs
# rompe con error de CORS aunque el dominio "real" ya este en CORS_ORIGINS.
# Acotado a este proyecto especifico (no *.vercel.app en general) para no
# habilitar credenciales desde cualquier otro proyecto alojado en Vercel.
VERCEL_PREVIEW_REGEX = r"https://proyectoalectours-docker(-[a-zA-Z0-9]+)*\.vercel\.app"


def get_extra_cors_origins() -> list[str]:
    """Solo los orígenes que vengan de CORS_ORIGINS en el entorno, sin los
    fijos de desarrollo — separado de get_cors_origins() porque
    error_handlers.py necesita justamente el dominio real de producción
    (no localhost) para su fallback de Access-Control-Allow-Origin."""
    return [origen.strip() for origen in os.getenv("CORS_ORIGINS", "").split(",") if origen.strip()]


def get_cors_origins() -> list[str]:
    """Orígenes fijos de desarrollo + los que vengan de CORS_ORIGINS en el
    entorno. Se lee el entorno en cada llamada (no se cachea a nivel de
    módulo) para que un valor distinto en pruebas no quede pegado del
    primer import — el costo real es parsear una variable de entorno y
    una lista corta, insignificante frente a cualquier request HTTP."""
    return _CORS_ORIGINS_DEV + get_extra_cors_origins()
