from typing import Optional, List
from datetime import datetime
from urllib.parse import quote

from fastapi import APIRouter, Depends, HTTPException, Header, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from app.core.database import get_db
from app.core.security import get_user_from_token
from app.core.cache import redis_client, get_cached, set_cached
from app.models.user_model import Usuario
from app.models.reserva_model import Reserva
from app.models.resena_model import Resena
from app.repositories.resena_repository import ResenaRepository

router = APIRouter(prefix="/api/resenas", tags=["Reseñas"])

HOME_CACHE_KEY = "home:resenas_destacadas"

# La tabla `resenas` no guarda avatar del cliente, así que generamos uno
# consistente con la paleta de marca (granate/dorado) cuando no hay foto_url.
AVATAR_BG = "7B1E3A"


def get_current_usuario(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)) -> Usuario:
    """Mismo patrón de auth usado en preferencias_route.py"""
    if not authorization:
        raise HTTPException(status_code=401, detail="No autenticado")

    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=401, detail="Token inválido")

    user_id = get_user_from_token(parts[1])
    if user_id is None:
        raise HTTPException(status_code=401, detail="Token expirado o inválido")

    user = db.query(Usuario).filter(Usuario.id_usuario == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    return user


class ResenaCreate(BaseModel):
    id_reserva: int
    calificacion: int = Field(..., ge=1, le=5)
    comentario: str = Field(..., min_length=10, max_length=1000)
    foto_url: Optional[str] = None


class ResenaResponse(BaseModel):
    id_resena: int
    id_reserva: int
    id_hotel: int
    calificacion: int
    comentario: str
    foto_url: Optional[str] = None
    fecha_creacion: datetime
    nombre_cliente: Optional[str] = None

    class Config:
        from_attributes = True


def _avatar_url(nombre_completo: str) -> str:
    return (
        f"https://ui-avatars.com/api/?name={quote(nombre_completo)}"
        f"&background={AVATAR_BG}&color=fff&size=128&font-size=0.4&bold=true"
    )


def _shape_resena(r: Resena) -> dict:
    """Formato compartido por /destacadas y el listado paginado: lo que
    consume directamente el frontend (tarjetas de testimonios)."""
    nombre = f"{r.cliente.nombre} {r.cliente.apellido[0]}." if r.cliente else "Viajero AlecTours"
    return {
        "id": r.id_resena,
        "name": nombre,
        "location": (
            f"{r.cliente.ciudad}, {r.cliente.pais}"
            if r.cliente and r.cliente.ciudad
            else (f"{r.hotel.ciudad}, {r.hotel.pais}" if r.hotel else "")
        ),
        "quote": r.comentario,
        "rating": r.calificacion,
        "trip": r.hotel.nombre_hotel if r.hotel else "AlecTours",
        "avatar": r.foto_url
        or _avatar_url(f"{r.cliente.nombre} {r.cliente.apellido}" if r.cliente else "Viajero AlecTours"),
        "fecha": r.fecha_creacion.isoformat() if r.fecha_creacion else None,
    }


@router.post("", response_model=ResenaResponse, status_code=201)
def crear_resena(
    data: ResenaCreate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_usuario),
):
    if not usuario.cliente:
        raise HTTPException(status_code=403, detail="Solo los clientes pueden dejar reseñas")

    reserva = db.query(Reserva).filter(Reserva.id_reserva == data.id_reserva).first()
    if not reserva:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")

    if reserva.id_cliente != usuario.cliente.id_cliente:
        raise HTTPException(status_code=403, detail="No puedes reseñar una reserva que no es tuya")

    if ResenaRepository.get_by_reserva(db, data.id_reserva):
        raise HTTPException(status_code=409, detail="Ya dejaste una reseña para esta reserva")

    id_hotel = ResenaRepository.get_hotel_id_from_reserva(db, data.id_reserva)
    if not id_hotel:
        raise HTTPException(status_code=422, detail="No se pudo asociar esta reserva a un hotel")

    resena = ResenaRepository.create(
        db,
        id_reserva=data.id_reserva,
        id_cliente=usuario.cliente.id_cliente,
        id_hotel=id_hotel,
        calificacion=data.calificacion,
        comentario=data.comentario,
        foto_url=data.foto_url,
    )

    # Invalidar caches afectados: el listado del hotel y el bloque de
    # testimonios del home (que puede incluir esta reseña si califica bien).
    redis_client.delete(f"hotel:{id_hotel}:resenas")
    redis_client.delete(HOME_CACHE_KEY)

    return ResenaResponse(
        id_resena=resena.id_resena,
        id_reserva=resena.id_reserva,
        id_hotel=resena.id_hotel,
        calificacion=resena.calificacion,
        comentario=resena.comentario,
        foto_url=resena.foto_url,
        fecha_creacion=resena.fecha_creacion,
        nombre_cliente=usuario.cliente.nombre,
    )


@router.get("")
def get_resenas_todas(
    skip: int = Query(0, ge=0),
    limit: int = Query(12, ge=1, le=50),
    db: Session = Depends(get_db),
):
    """
    Listado público y paginado de TODAS las reseñas (cualquier calificación),
    usado en la página /testimonios ("ver todas las opiniones").
    """
    resenas = ResenaRepository.get_all(db, skip=skip, limit=limit)
    total = ResenaRepository.count_all(db)
    promedio_row = ResenaRepository.get_promedio_global(db)

    return {
        "total": total,
        "promedio": round(float(promedio_row.promedio), 1) if promedio_row and promedio_row.promedio else 5.0,
        "resenas": [_shape_resena(r) for r in resenas],
    }


@router.get("/hotel/{id_hotel}", response_model=List[ResenaResponse])
def get_resenas_hotel(id_hotel: int, db: Session = Depends(get_db)):
    resenas = ResenaRepository.get_by_hotel(db, id_hotel)
    return [
        ResenaResponse(
            id_resena=r.id_resena,
            id_reserva=r.id_reserva,
            id_hotel=r.id_hotel,
            calificacion=r.calificacion,
            comentario=r.comentario,
            foto_url=r.foto_url,
            fecha_creacion=r.fecha_creacion,
            nombre_cliente=f"{r.cliente.nombre} {r.cliente.apellido[0]}." if r.cliente else "Viajero AlecTours",
        )
        for r in resenas
    ]


@router.get("/destacadas")
def get_resenas_destacadas(db: Session = Depends(get_db)):
    """
    Endpoint público (sin auth) para la sección de Testimonios del home.
    Trae las mejores reseñas (4-5 estrellas) de toda la plataforma, junto
    con el promedio y total global, cacheado 10 min en Redis.
    """
    cached = get_cached(HOME_CACHE_KEY)
    if cached:
        return cached

    resenas = ResenaRepository.get_destacadas(db, limit=6)
    promedio_row = ResenaRepository.get_promedio_global(db)

    data = {
        "promedio": round(float(promedio_row.promedio), 1) if promedio_row and promedio_row.promedio else 5.0,
        "total": promedio_row.total if promedio_row else 0,
        "resenas": [_shape_resena(r) for r in resenas],
    }

    set_cached(HOME_CACHE_KEY, data, ttl_seconds=600)  # 10 min
    return data