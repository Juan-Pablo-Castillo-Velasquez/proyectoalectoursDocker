from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_user_from_token
from app.models.hotel_model import Hotel
from app.models.user_model import Usuario
from app.repositories.favorito_repository import FavoritoRepository
from app.schemas.favorito_schema import FavoritoCreate, FavoritoResponse

router = APIRouter(prefix="/api/favoritos", tags=["Favoritos"])


def get_current_usuario(authorization: str | None = Header(None), db: Session = Depends(get_db)) -> Usuario:
    """Mismo patrón de auth usado en resena_route.py / preferencias_route.py"""
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


def _require_cliente(usuario: Usuario) -> int:
    if not usuario.cliente:
        raise HTTPException(status_code=403, detail="Solo los clientes pueden gestionar favoritos")
    return usuario.cliente.id_cliente


@router.get("", response_model=list[FavoritoResponse])
def listar_favoritos(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_usuario),
):
    """Lista completa de hoteles favoritos del cliente autenticado, con los
    datos del hotel embebidos (usado en la pestaña Favoritos del perfil)."""
    id_cliente = _require_cliente(usuario)
    return FavoritoRepository.get_by_cliente(db, id_cliente)


@router.get("/ids", response_model=list[int])
def listar_ids_favoritos(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_usuario),
):
    """Solo los id_hotel favoritos: liviano, pensado para pintar el corazón
    activo/inactivo en cada HotelCard de un listado sin traer el hotel completo."""
    id_cliente = _require_cliente(usuario)
    return FavoritoRepository.get_ids_by_cliente(db, id_cliente)


@router.post("", response_model=FavoritoResponse, status_code=201)
def agregar_favorito(
    data: FavoritoCreate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_usuario),
):
    id_cliente = _require_cliente(usuario)

    hotel = db.query(Hotel).filter(Hotel.id_hotel == data.id_hotel).first()
    if not hotel:
        raise HTTPException(status_code=404, detail="Hotel no encontrado")

    existente = FavoritoRepository.get_by_cliente_and_hotel(db, id_cliente, data.id_hotel)
    if existente:
        return existente

    return FavoritoRepository.create(db, id_cliente=id_cliente, id_hotel=data.id_hotel)


@router.delete("/{id_hotel}", status_code=204)
def quitar_favorito(
    id_hotel: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_usuario),
):
    id_cliente = _require_cliente(usuario)
    eliminado = FavoritoRepository.delete(db, id_cliente=id_cliente, id_hotel=id_hotel)
    if not eliminado:
        raise HTTPException(status_code=404, detail="Este hotel no está en tus favoritos")
    return None
