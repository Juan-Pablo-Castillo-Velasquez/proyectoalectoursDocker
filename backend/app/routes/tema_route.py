"""Temas de color de temporada (Navidad, Halloween, etc.) -- el admin los
crea/edita y activa uno a la vez para recolorear el acento de marca (granate
+ dorado) en todo el sitio, sin tocar fondos/textos base. Ver
app/models/tema_model.py para el porqué de cada campo y la verificación de
contraste WCAG 2.1 AA."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.cache import delete_pattern, get_cached, set_cached
from app.core.database import get_db
from app.core.exceptions import NotFoundError
from app.core.security import require_admin
from app.repositories.tema_repository import TemaEnUsoError, TemaRepository
from app.schemas.tema_schema import TemaCreate, TemaResponse, TemaUpdate

router = APIRouter(prefix="/api/temas", tags=["Temas"])

TEMA_ACTIVO_CACHE_KEY = "tema:activo"
TEMA_CACHE_PATTERN = "tema:*"
TEMA_ACTIVO_CACHE_TTL = 300  # 5 min -- igual se invalida al instante en cada escritura


# ===================== PÚBLICO =====================
@router.get("/activo", response_model=TemaResponse)
def get_tema_activo(db: Session = Depends(get_db)):
    """El tema vigente ahora mismo -- lo consume el frontend en el arranque
    de la app para pintar --primary/--gold correctos antes del primer
    render (ver TemaProvider.tsx)."""
    cached = get_cached(TEMA_ACTIVO_CACHE_KEY)
    if cached is not None:
        return cached

    tema = TemaRepository.get_activo(db)
    if not tema:
        raise HTTPException(status_code=404, detail="No hay ningún tema configurado")
    data = TemaResponse.model_validate(tema).model_dump(mode="json")
    set_cached(TEMA_ACTIVO_CACHE_KEY, data, ttl_seconds=TEMA_ACTIVO_CACHE_TTL)
    return data


# ===================== ADMIN =====================
@router.get("/", response_model=list[TemaResponse])
def get_temas_admin(db: Session = Depends(get_db), admin_id: int = Depends(require_admin)):
    return TemaRepository.get_all(db)


@router.post("/", response_model=TemaResponse, status_code=201)
def create_tema(
    datos: TemaCreate,
    db: Session = Depends(get_db),
    admin_id: int = Depends(require_admin),
):
    nuevo = TemaRepository.create(db, datos.model_dump())
    return nuevo


@router.put("/{id_tema}", response_model=TemaResponse)
def update_tema(
    id_tema: int,
    datos: TemaUpdate,
    db: Session = Depends(get_db),
    admin_id: int = Depends(require_admin),
):
    try:
        actualizado = TemaRepository.update(db, id_tema, datos.model_dump())
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=e.detail) from e
    delete_pattern(TEMA_CACHE_PATTERN)  # por si el tema editado era el activo
    return actualizado


@router.put("/{id_tema}/activar", response_model=TemaResponse)
def activar_tema(
    id_tema: int,
    db: Session = Depends(get_db),
    admin_id: int = Depends(require_admin),
):
    try:
        tema = TemaRepository.activar(db, id_tema)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=e.detail) from e
    delete_pattern(TEMA_CACHE_PATTERN)
    return tema


@router.delete("/{id_tema}")
def delete_tema(id_tema: int, db: Session = Depends(get_db), admin_id: int = Depends(require_admin)):
    try:
        resultado = TemaRepository.delete(db, id_tema)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=e.detail) from e
    except TemaEnUsoError as e:
        raise HTTPException(status_code=409, detail=str(e)) from e
    delete_pattern(TEMA_CACHE_PATTERN)
    return resultado
