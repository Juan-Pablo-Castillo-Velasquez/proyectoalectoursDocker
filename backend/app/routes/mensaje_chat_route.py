"""
Chat privado admin<->cliente (con capturas via Cloudinary) -- un solo hilo
continuo por cliente (no uno por reserva) y bandeja compartida: cualquier
admin puede ver y responder el hilo de cualquier cliente, sin asignacion
1-a-1. Solo polling desde el frontend (sin websockets -- el backend esta
en el plan free de Render, que duerme tras 15 min de inactividad y
mataria cualquier socket abierto).

Nota sobre las rutas de escritura: RATE_LIMITED_PATHS (security_middleware.py)
filtra solo por PATH, no por metodo HTTP -- si el envio del cliente
compartiera el mismo path literal que su lectura (ambos "/api/mensajes/me"),
agregar ese path a RATE_LIMITED_PATHS limitaria tambien el GET de polling,
justo lo que el diseño de este modulo busca evitar. Por eso el envio del
cliente vive en su propio path "/me/enviar", distinto de la lectura "/me".
"""

from fastapi import APIRouter, Depends, File, Form, Header, HTTPException, Query, UploadFile
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_usuario, usuario_es_admin
from app.core.file_validation import validar_y_leer_archivo
from app.core.image_storage import guardar_imagen
from app.core.security import require_admin
from app.models.reserva_model import Reserva
from app.models.user_model import Usuario
from app.repositories.mensaje_chat_repository import MensajeChatRepository
from app.schemas.mensaje_chat_schema import (
    ConteoNoLeidosResponse,
    HilosPaginadosResponse,
    MensajeChatResponse,
)

router = APIRouter(prefix="/api/mensajes", tags=["Mensajes"])

PUBLIC_PATH_PREFIX = "/uploads/chat"
# Mismo criterio de formato/tamaño que banner_route.py -- una captura de
# pantalla de reserva/pago no necesita más que esto.
IMAGEN_TIPOS_PERMITIDOS = {"image/jpeg", "image/jpg", "image/png", "image/webp"}
TAMANO_MAXIMO_BYTES = 5 * 1024 * 1024  # 5MB


class MarcarLeidoRequest(BaseModel):
    # Solo lo usa un admin (para indicar de qué cliente es el hilo) -- un
    # cliente marcando su propio hilo lo omite, ver marcar_leido() abajo.
    id_cliente: int | None = None


def _exigir_cliente(usuario: Usuario) -> int:
    if not usuario.cliente:
        raise HTTPException(status_code=403, detail="Esta cuenta no tiene un perfil de cliente asociado.")
    return usuario.cliente.id_cliente


def _validar_contenido_o_imagen(contenido: str | None, imagen: UploadFile | None) -> None:
    if not contenido and imagen is None:
        raise HTTPException(status_code=400, detail="El mensaje necesita texto o una imagen.")


def _validar_reserva_del_cliente(db: Session, id_reserva: int | None, id_cliente: int) -> None:
    """Si se etiqueta un mensaje con una reserva, esa reserva debe ser DEL
    MISMO cliente del hilo -- nunca se confía en el id_reserva del body sin
    verificar propiedad primero (evita que alguien etiquete un mensaje con
    la reserva de otro cliente adivinando su id)."""
    if id_reserva is None:
        return
    reserva = db.query(Reserva).filter(Reserva.id_reserva == id_reserva).first()
    if not reserva or reserva.id_cliente != id_cliente:
        raise HTTPException(status_code=404, detail="La reserva indicada no existe o no pertenece a este cliente.")


async def _guardar_imagen_chat(imagen: UploadFile) -> str:
    contenido, extension = await validar_y_leer_archivo(
        imagen,
        tipos_permitidos=IMAGEN_TIPOS_PERMITIDOS,
        mensaje_tipo="Formato de imagen no soportado. Usa JPG, PNG o WEBP.",
        tamano_maximo_bytes=TAMANO_MAXIMO_BYTES,
    )
    return guardar_imagen(contenido, extension, carpeta="chat", public_path_prefix=PUBLIC_PATH_PREFIX)


# ===================== ADMIN (bandeja compartida) =====================


@router.get("/hilos", response_model=HilosPaginadosResponse)
def get_hilos(
    search: str | None = Query(None, description="Filtra por nombre, apellido o correo del cliente"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    admin_id: int = Depends(require_admin),
):
    """Clientes con hilo, ordenados por mensaje más reciente, paginados y
    con búsqueda opcional -- lo que alimenta la bandeja de
    ModuleMensajes.tsx (polling ~8-10s). Mismo contrato skip/limit que el
    resto del proyecto (ver reserva_route.py), nunca page/page_size. Sin
    caché: es una vista administrativa que debe reflejar mensajes nuevos
    de inmediato, no contenido público de alto tráfico."""
    items, total = MensajeChatRepository.get_hilos(db, search=search, skip=skip, limit=limit)
    return {"items": items, "total": total, "skip": skip, "limit": limit}


@router.get("/hilos/{id_cliente}", response_model=list[MensajeChatResponse])
def get_hilo_admin(
    id_cliente: int,
    after_id: int | None = Query(None, description="Solo mensajes con id mayor a este -- polling incremental"),
    db: Session = Depends(get_db),
    admin_id: int = Depends(require_admin),
):
    return MensajeChatRepository.get_mensajes(db, id_cliente, after_id=after_id)


@router.post("/enviar", response_model=MensajeChatResponse, status_code=201)
async def enviar_como_admin(
    id_cliente: int = Form(...),
    contenido: str | None = Form(None),
    imagen: UploadFile | None = File(None),
    id_reserva: int | None = Form(None, description="Reserva de la que se está hablando, opcional"),
    db: Session = Depends(get_db),
    admin_id: int = Depends(require_admin),
):
    _validar_contenido_o_imagen(contenido, imagen)
    _validar_reserva_del_cliente(db, id_reserva, id_cliente)
    imagen_url = await _guardar_imagen_chat(imagen) if imagen is not None else None
    return MensajeChatRepository.crear_mensaje(
        db,
        id_cliente=id_cliente,
        id_usuario_remitente=admin_id,
        remitente_tipo="admin",
        contenido=contenido,
        imagen_url=imagen_url,
        id_reserva=id_reserva,
    )


# ===================== CLIENTE (su propio hilo) =====================


@router.get("/me", response_model=list[MensajeChatResponse])
def get_mi_hilo(
    after_id: int | None = Query(None, description="Solo mensajes con id mayor a este -- polling incremental"),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_usuario),
):
    """El id_cliente SIEMPRE se resuelve del propio token, nunca de un
    parámetro -- así se garantiza que un cliente jamás pueda leer el hilo
    de otro cambiando un id en la petición."""
    id_cliente = _exigir_cliente(current_user)
    return MensajeChatRepository.get_mensajes(db, id_cliente, after_id=after_id)


@router.post("/me/enviar", response_model=MensajeChatResponse, status_code=201)
async def enviar_como_cliente(
    contenido: str | None = Form(None),
    imagen: UploadFile | None = File(None),
    id_reserva: int | None = Form(None, description="Reserva de la que se está hablando, opcional"),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_usuario),
):
    id_cliente = _exigir_cliente(current_user)
    _validar_contenido_o_imagen(contenido, imagen)
    _validar_reserva_del_cliente(db, id_reserva, id_cliente)
    imagen_url = await _guardar_imagen_chat(imagen) if imagen is not None else None
    return MensajeChatRepository.crear_mensaje(
        db,
        id_cliente=id_cliente,
        id_usuario_remitente=current_user.id_usuario,
        remitente_tipo="cliente",
        contenido=contenido,
        imagen_url=imagen_url,
        id_reserva=id_reserva,
    )


# ===================== COMPARTIDOS (ambos roles) =====================


@router.patch("/leido")
def marcar_leido(
    data: MarcarLeidoRequest,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_usuario),
    authorization: str | None = Header(None),
):
    """Un solo endpoint para ambos roles -- bandeja compartida: cualquier
    admin puede marcar leído cualquier hilo. Admin: body {id_cliente},
    marca los mensajes del CLIENTE de ese hilo. Cliente: body vacío/omitido,
    marca los mensajes del ADMIN de su propio hilo (mismo criterio de
    "nunca resolver id_cliente de un parámetro" que get_mi_hilo)."""
    if usuario_es_admin(authorization):
        if data.id_cliente is None:
            raise HTTPException(status_code=422, detail="id_cliente es requerido para administradores.")
        actualizados = MensajeChatRepository.marcar_leido(db, data.id_cliente, "cliente")
    else:
        id_cliente = _exigir_cliente(current_user)
        actualizados = MensajeChatRepository.marcar_leido(db, id_cliente, "admin")
    return {"actualizados": actualizados}


@router.get("/no-leidos", response_model=ConteoNoLeidosResponse)
def get_no_leidos(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_usuario),
    authorization: str | None = Header(None),
):
    """Nunca se cachea -- mismo criterio ya establecido para conteos de
    no-leídos (ver Notificacion en notificacion_route.py). Admin: total
    global de todos los hilos. Cliente: no-leídos de su propio hilo."""
    if usuario_es_admin(authorization):
        return {"no_leidos": MensajeChatRepository.contar_no_leidos_admin(db)}
    id_cliente = _exigir_cliente(current_user)
    return {"no_leidos": MensajeChatRepository.contar_no_leidos_cliente(db, id_cliente)}
