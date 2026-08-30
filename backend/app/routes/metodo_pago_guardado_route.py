from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_user_from_token, hash_password, verify_password
from app.models.user_model import Usuario
from app.repositories.metodo_pago_guardado_repository import MetodoPagoGuardadoRepository
from app.schemas.metodo_pago_guardado_schema import (
    MetodoPagoGuardadoCreate,
    MetodoPagoGuardadoResponse,
    VerificarClaveRequest,
    VerificarClaveResponse,
)

router = APIRouter(prefix="/api/metodos-pago-guardados", tags=["Métodos de pago guardados"])


def get_current_usuario(authorization: str | None = Header(None), db: Session = Depends(get_db)) -> Usuario:
    """Mismo patrón de auth usado en favorito_route.py / resena_route.py"""
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
        raise HTTPException(status_code=403, detail="Solo los clientes pueden gestionar métodos de pago guardados")
    return usuario.cliente.id_cliente


@router.get("", response_model=list[MetodoPagoGuardadoResponse])
def listar_metodos_guardados(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_usuario),
):
    id_cliente = _require_cliente(usuario)
    return MetodoPagoGuardadoRepository.get_by_cliente(db, id_cliente)


@router.post("", response_model=MetodoPagoGuardadoResponse, status_code=201)
def guardar_metodo_pago(
    data: MetodoPagoGuardadoCreate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_usuario),
):
    id_cliente = _require_cliente(usuario)
    clave_hash = hash_password(data.clave)
    return MetodoPagoGuardadoRepository.create(
        db,
        id_cliente=id_cliente,
        alias=data.alias,
        tipo=data.tipo,
        ultimos4=data.ultimos4,
        clave_hash=clave_hash,
        predeterminado=data.predeterminado,
    )


@router.post("/{id_metodo_guardado}/verificar", response_model=VerificarClaveResponse)
def verificar_clave_metodo(
    id_metodo_guardado: int,
    data: VerificarClaveRequest,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_usuario),
):
    """
    Verifica la clave de confirmación de un método guardado antes de usarlo
    para autorizar un pago. Nunca expone el hash guardado, solo indica si
    la clave ingresada coincide.
    """
    id_cliente = _require_cliente(usuario)
    metodo = MetodoPagoGuardadoRepository.get_by_id(db, id_cliente, id_metodo_guardado)
    if not metodo:
        raise HTTPException(status_code=404, detail="Método de pago guardado no encontrado")
    return VerificarClaveResponse(valido=verify_password(data.clave, metodo.clave_hash))


@router.delete("/{id_metodo_guardado}", status_code=204)
def eliminar_metodo_guardado(
    id_metodo_guardado: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_usuario),
):
    id_cliente = _require_cliente(usuario)
    eliminado = MetodoPagoGuardadoRepository.delete(db, id_cliente, id_metodo_guardado)
    if not eliminado:
        raise HTTPException(status_code=404, detail="Método de pago guardado no encontrado")
    return None
