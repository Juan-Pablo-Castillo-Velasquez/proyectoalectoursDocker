"""
Módulo de seguridad: autenticación JWT, hashing de contraseñas y autorización.
"""

from datetime import datetime, timedelta, timezone
from typing import Optional, List

from fastapi import Header, HTTPException
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=7)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        return None


def get_user_from_token(token: str) -> Optional[int]:
    payload = decode_token(token)
    if payload is None:
        return None
    user_id = payload.get("sub")
    if user_id is None:
        return None
    try:
        return int(user_id)
    except (ValueError, TypeError):
        return None


def generate_token_pair(user_id: int, roles: List[str] = []) -> dict:
    """
    Genera access + refresh token.
    Ahora incluye los roles en el payload del JWT.

    Args:
        user_id: ID del usuario
        roles: Lista de nombres de rol (ej. ['admin', 'cliente'])

    Returns:
        Dict con access_token, refresh_token y token_type
    """
    payload = {
        "sub": str(user_id),
        "roles": roles,          # ← nuevo campo
    }
    access_token = create_access_token(data=payload)
    refresh_token = create_refresh_token(data={"sub": str(user_id)})

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }


def create_verification_token(email: str) -> str:
    to_encode = {"email": email, "type": "verification"}
    expire = datetime.now(timezone.utc) + timedelta(hours=24)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def verify_verification_token(token: str) -> Optional[str]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("type") != "verification":
            return None
        return payload.get("email")
    except JWTError:
        return None


def get_current_user(authorization: Optional[str] = None) -> Optional[int]:
    from fastapi import HTTPException
    if not authorization:
        raise HTTPException(status_code=401, detail="No autenticado")
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=401, detail="Token inválido")
    user_id = get_user_from_token(parts[1])
    if user_id is None:
        raise HTTPException(status_code=401, detail="Token expirado o inválido")
    return user_id


def require_admin(authorization: Optional[str] = Header(None)) -> int:
    """
    Dependency reutilizable para endpoints exclusivos de administrador:
    exige un JWT válido cuyo claim `roles` incluya "admin". Se usa como
    `Depends(require_admin)` en las rutas de administración (usuarios/roles,
    solicitudes de cancelación, etc).
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="No autenticado")
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=401, detail="Token inválido")

    payload = decode_token(parts[1])
    if payload is None:
        raise HTTPException(status_code=401, detail="Token expirado o inválido")

    roles = payload.get("roles") or []
    if "admin" not in roles:
        raise HTTPException(status_code=403, detail="Requiere rol de administrador")

    return int(payload["sub"])