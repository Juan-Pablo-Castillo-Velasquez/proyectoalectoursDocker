import logging
import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from sqlalchemy import text


# IMPORTANTE: Importar TODOS los modelos para que SQLAlchemy conozca las relaciones
from app.models.user_model import Usuario
from app.models.cliente_model import Cliente
from app.models.hotel_model import Hotel
from app.models.reserva_model import Reserva
from app.models.resena_model import Resena
from app.models.favorito_model import Favorito
from app.models.metodo_pago_guardado_model import MetodoPagoGuardado

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

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# MANEJADOR DE ERRORES GLOBAL
# ============================================================================

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Error no controlado en {request.url.path}: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Error interno del servidor. Revisa los logs de Docker para ver el traceback completo.",
            "error_message": str(exc),
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