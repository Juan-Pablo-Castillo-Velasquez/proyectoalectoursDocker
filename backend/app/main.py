import logging
import os
from fastapi import FastAPI, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.cache import redis_client


# IMPORTANTE: Importar TODOS los modelos para que SQLAlchemy conozca las relaciones
from app.models.user_model import Usuario
from app.models.cliente_model import Cliente
from app.models.hotel_model import Hotel
from app.models.reserva_model import Reserva
from app.models.resena_model import Resena
from app.models.favorito_model import Favorito
from app.models.metodo_pago_guardado_model import MetodoPagoGuardado
from app.models.configuracion_model import ConfiguracionSistema
from app.models.notificacion_model import Notificacion
from app.models.empresa_model import SolicitudCorporativa

# Routers
from app.routes.auth_route import router as auth_router
from app.routes.cliente_route import router as cliente_router
from app.routes.contacto_route import router as contacto_router
from app.routes.hotel_route import router as hotel_router
from app.routes.preferencias_route import router as preferencias_router
from app.routes.promociones_route import router as promociones_router
from app.routes.resena_route import router as resena_route
from app.routes.reserva_route import router as reserva_router
from app.routes.usuario_route import router as usuario_router, roles_router
from app.routes.destino_route import router as destino_router
from app.routes.servicio_route import router as servicio_router
from app.routes.solicitud_cancelacion_route import router as solicitud_cancelacion_router
from app.routes.favorito_route import router as favorito_router
from app.routes.metodo_pago_guardado_route import router as metodo_pago_guardado_router
from app.routes.configuracion_route import router as configuracion_router
from app.routes.notificacion_route import router as notificacion_router
from app.routes.empresa_route import router as empresa_router
from app.routes.dashboard_route import router as dashboard_router

# ============================================================================
# CONFIGURACIÓN LOGGING
# ============================================================================

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============================================================================
# CREACIÓN AUTOMÁTICA DE TABLAS
# ============================================================================

# ELIMINADO (2026-08-26): Base.metadata.create_all(bind=engine) creaba
# directamente en Postgres cualquier tabla que SQLAlchemy detectara como
# "faltante", en paralelo a Alembic. En dev, con uvicorn --reload y el
# volumen bind-mount de ./backend, cualquier edición de un modelo (por
# ejemplo al agregar Favorito) dispara un reload que reimporta este módulo
# ANTES de que la migración de Alembic correspondiente llegue a correr,
# así que create_all() crea la tabla primero por su cuenta. Cuando el
# contenedor se reinicia y entrypoint.sh corre `alembic upgrade head`,
# Alembic todavía cree que esa migración está pendiente e intenta el mismo
# CREATE TABLE, y Postgres responde con "relation ya existe" — justo el
# crash-loop que viste en los logs con la tabla `favoritos`.
# Alembic (backend/alembic/versions/) ya es la única fuente de verdad del
# esquema en este proyecto; create_all() no debería seguir compitiendo con
# él. Si alguna vez hace falta recrear el esquema desde cero en un entorno
# nuevo, usa `alembic upgrade head`, no create_all().

# ============================================================================
# APP
# ============================================================================

app = FastAPI(
    title="AlecTours API",
    description="API para gestión de hoteles y reservas",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# ============================================================================
# CORS
# ============================================================================

@app.get("/health", tags=["Salud"])
def health_check(db: Session = Depends(get_db)):
    """Liveness/readiness check real (consulta la base de datos, no un valor
    fijo) — usado por el HEALTHCHECK del Dockerfile de producción y por
    cualquier balanceador/orquestador que necesite saber si el contenedor
    está listo para recibir tráfico."""
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ok", "database": "up"}
    except Exception as e:
        logger.error(f"Health check falló: {e}")
        return JSONResponse(status_code=503, content={"status": "error", "database": "down"})


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
_cors_origins_env = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_CORS_ORIGINS_DEV + _cors_origins_env,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# SEGURIDAD: RATE LIMITING + HEADERS HTTP
# ============================================================================
# Alternativa de código a lo que se pidió originalmente como "Cisco Secure
# Web Appliance": eso es un dispositivo de seguridad de red/perímetro que se
# contrata e instala en la infraestructura de la empresa, no algo que se
# pueda agregar a este repositorio. Esto cubre, en cambio, lo que sí es
# código: límite de intentos sobre endpoints sensibles (fuerza bruta) y
# headers de respuesta estándar de buenas prácticas.

# (ruta exacta o prefijo) -> (máximo de solicitudes, ventana en segundos)
_RATE_LIMITED_PATHS = {
    "/auth/login": (5, 60),
    "/auth/register": (5, 60),
    "/auth/forgot-password": (3, 60),
    "/auth/reset-password": (5, 60),
}


def _rate_limit_config_for(path: str):
    if path in _RATE_LIMITED_PATHS:
        limit, window = _RATE_LIMITED_PATHS[path]
        return path, limit, window
    # /api/reservas/{id}/pagar es dinámica (el id varía) — se agrupa bajo
    # una sola clave "/pagar" para que el límite sea real por IP, no por id.
    if path.startswith("/api/reservas/") and path.endswith("/pagar"):
        return "/pagar", 10, 60
    return None


@app.middleware("http")
async def seguridad_middleware(request: Request, call_next):
    config = _rate_limit_config_for(request.url.path)
    if config:
        bucket, limit, window = config
        ip = request.client.host if request.client else "desconocido"
        key = f"ratelimit:{bucket}:{ip}"
        try:
            intentos = redis_client.incr(key)
            if intentos == 1:
                redis_client.expire(key, window)
            if intentos > limit:
                response = JSONResponse(
                    status_code=429,
                    content={"detail": "Demasiadas solicitudes. Intenta de nuevo en un momento."},
                )
                response.headers["X-Content-Type-Options"] = "nosniff"
                response.headers["X-Frame-Options"] = "DENY"
                return response
        except Exception:
            # Si Redis no responde, no se bloquea tráfico real (login,
            # registro) por un problema de infraestructura ajeno al
            # usuario — el rate limit es una capa extra, no la única.
            pass

    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    # HSTS no tiene efecto sobre HTTP plano (dev en localhost) — el
    # navegador la ignora ahí y queda lista para cuando haya HTTPS real en
    # producción, sin necesidad de un segundo cambio después.
    response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains"
    return response

# ============================================================================
# MANEJADOR DE ERRORES GLOBAL
# ============================================================================

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # El traceback completo queda en los logs del servidor (exc_info=True);
    # al cliente solo se le devuelve un mensaje genérico. Antes se incluía
    # str(exc) también en la respuesta HTTP ("error_message"), lo que
    # filtraba detalles internos (nombres de constraints de la BD, rutas
    # del servidor, etc.) a cualquiera que llamara la API — corregido en
    # la Fase 1 del plan de mejora ("manejo de errores consistente").
    logger.error(f"Error no controlado en {request.url.path}: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Error interno del servidor. Revisa los logs del servidor para ver el detalle.",
        },
        headers={
            "Access-Control-Allow-Origin": request.headers.get("origin", "http://localhost:5173"),
            "Access-Control-Allow-Credentials": "true",
        },
    )

# ============================================================================
# MIDDLEWARE LOGS
# ============================================================================

@app.middleware("http")
async def log_requests(request, call_next):
    logger.info(f"{request.method} {request.url.path}")
    response = await call_next(request)
    logger.info(f"Response: {response.status_code}")
    return response

# ============================================================================
# ROUTERS
# ============================================================================

app.include_router(auth_router)
app.include_router(hotel_router)
app.include_router(cliente_router)
app.include_router(reserva_router)
app.include_router(preferencias_router)
app.include_router(promociones_router)
app.include_router(contacto_router)
app.include_router(resena_route)
app.include_router(usuario_router)
app.include_router(roles_router)
app.include_router(destino_router)
app.include_router(servicio_router)
app.include_router(solicitud_cancelacion_router)
app.include_router(favorito_router)
app.include_router(metodo_pago_guardado_router)
app.include_router(configuracion_router)
app.include_router(notificacion_router)
app.include_router(empresa_router)
app.include_router(dashboard_router)

# ============================================================================
# ARCHIVOS ESTÁTICOS (fotos de perfil, etc.)
# ============================================================================

_UPLOADS_DIR = os.path.join(os.path.dirname(__file__), "static", "uploads")
os.makedirs(os.path.join(_UPLOADS_DIR, "perfiles"), exist_ok=True)
os.makedirs(os.path.join(_UPLOADS_DIR, "comprobantes"), exist_ok=True)
app.mount("/uploads", StaticFiles(directory=_UPLOADS_DIR), name="uploads")

# ============================================================================
# ENDPOINTS
# ============================================================================

@app.get("/")
def root():
    return {"message": "API Alecktours funcionando"}