from typing import Optional, List
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from app.core.database import get_db
from app.core.security import get_user_from_token
from app.core.cache import redis_client
from app.models.user_model import Usuario
from app.models.reserva_model import Reserva
from app.repositories.resena_repository import ResenaRepository

router = APIRouter(prefix="/api/resenas", tags=["Reseñas"])


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

    redis_client.delete(f"hotel:{id_hotel}:resenas")

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