"""
Dependencias de autenticación/autorización reutilizables en las rutas del
backend.

Antes de esto, la función que decodifica el JWT y trae el Usuario completo
desde la base de datos ("get_current_usuario") estaba copiada de forma
idéntica en preferencias_route.py, solicitud_cancelacion_route.py y
resena_route.py. Ahora vive en un solo lugar y esos archivos importan de
aquí — ver Fase 0 del plan de mejora (docs/referencia-tecnica/).
"""
from typing import Optional

from fastapi import Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_user_from_token, decode_token
from app.models.user_model import Usuario


def get_current_usuario(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
) -> Usuario:
    """Exige un JWT válido en el header Authorization y devuelve el Usuario
    completo (con id_cliente, id_empleado) desde la base de datos."""
    if not authorization:
        raise HTTPException(status_code=401, detail="No autenticado")

    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=401, detail="Token inválido")

    user_id = get_user_from_token(parts[1])
    if user_id is None:
        raise HTTPException(status_code=401, detail="Token expirado o inválido")

    usuario = db.query(Usuario).filter(Usuario.id_usuario == user_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    return usuario


def usuario_es_admin(authorization: Optional[str]) -> bool:
    """Mismo chequeo que require_admin (security.py) pero sin lanzar
    excepción — para combinarlo con un chequeo de propiedad ('el dueño del
    recurso O un admin'), en vez de exigir solo una de las dos cosas."""
    if not authorization:
        return False
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return False
    payload = decode_token(parts[1])
    if not payload:
        return False
    return "admin" in (payload.get("roles") or [])


def exigir_propietario_o_admin(
    current_user: Usuario,
    id_cliente_recurso: Optional[int],
    authorization: Optional[str],
) -> None:
    """Lanza 403 salvo que quien llama sea el dueño del recurso (mismo
    id_cliente) o tenga rol admin en su JWT. Centraliza el patrón repetido
    en las rutas de reservas/pagos/preferencias que exponen datos de UN
    cliente en particular."""
    if id_cliente_recurso is not None and current_user.id_cliente == id_cliente_recurso:
        return
    if usuario_es_admin(authorization):
        return
    raise HTTPException(status_code=403, detail="No tienes permiso para acceder a estos datos")
