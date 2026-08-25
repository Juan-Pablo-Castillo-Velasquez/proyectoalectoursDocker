from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.servicio_model import Destino
from app.schemas.destino_schema import (
    DestinoCreate,
    DestinoUpdate,
    DestinoResponse,
    DestinoSugerenciaResponse,
)

router = APIRouter(prefix="/api/destinos", tags=["Destinos"])


def _filtro_busqueda(query, q: str):
    patron = f"%{q}%"
    return query.filter(
        or_(
            Destino.nombre_destino.ilike(patron),
            Destino.ciudad.ilike(patron),
            Destino.pais.ilike(patron),
        )
    )


@router.get("/sugerencias", response_model=list[DestinoSugerenciaResponse])
def get_sugerencias_destinos(
    q: Optional[str] = Query(None, min_length=0),
    limit: int = Query(8, ge=1, le=20),
    db: Session = Depends(get_db),
):
    """Autocompletado liviano usado por el buscador de destinos del Hero."""
    query = db.query(Destino)
    if q:
        query = _filtro_busqueda(query, q)
    return query.order_by(Destino.nombre_destino.asc()).limit(limit).all()


@router.get("/", response_model=list[DestinoResponse])
def get_destinos(
    q: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(Destino)
    if q:
        query = _filtro_busqueda(query, q)
    return query.order_by(Destino.nombre_destino.asc()).offset(skip).limit(limit).all()


@router.get("/{destino_id}", response_model=DestinoResponse)
def get_destino(destino_id: int, db: Session = Depends(get_db)):
    destino = db.query(Destino).filter(Destino.id_destino == destino_id).first()
    if not destino:
        raise HTTPException(status_code=404, detail="Destino no encontrado")
    return destino


@router.post("/", response_model=DestinoResponse, status_code=201)
def create_destino(data: DestinoCreate, db: Session = Depends(get_db)):
    destino = Destino(**data.dict())
    db.add(destino)
    db.commit()
    db.refresh(destino)
    return destino


@router.put("/{destino_id}", response_model=DestinoResponse)
def update_destino(destino_id: int, data: DestinoUpdate, db: Session = Depends(get_db)):
    destino = db.query(Destino).filter(Destino.id_destino == destino_id).first()
    if not destino:
        raise HTTPException(status_code=404, detail="Destino no encontrado")
    for key, value in data.dict(exclude_unset=True).items():
        setattr(destino, key, value)
    db.commit()
    db.refresh(destino)
    return destino


@router.delete("/{destino_id}")
def delete_destino(destino_id: int, db: Session = Depends(get_db)):
    destino = db.query(Destino).filter(Destino.id_destino == destino_id).first()
    if not destino:
        raise HTTPException(status_code=404, detail="Destino no encontrado")
    db.delete(destino)
    db.commit()
    return {"message": "Destino eliminado exitosamente"}
