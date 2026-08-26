from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.servicio_model import Servicio, CategoriaServicio
from app.schemas.servicio_schema import (
    ServicioCreate,
    ServicioUpdate,
    ServicioResponse,
    CategoriaServicioResponse,
)

router = APIRouter(prefix="/api/servicios", tags=["Servicios"])


@router.get("/categorias", response_model=list[CategoriaServicioResponse])
def get_categorias(db: Session = Depends(get_db)):
    return db.query(CategoriaServicio).order_by(CategoriaServicio.nombre_categoria.asc()).all()


@router.get("/", response_model=list[ServicioResponse])
def get_servicios(
    id_destino: Optional[int] = Query(None),
    id_categoria: Optional[int] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(Servicio)
    if id_destino is not None:
        query = query.filter(Servicio.id_destino == id_destino)
    if id_categoria is not None:
        query = query.filter(Servicio.id_categoria == id_categoria)
    return query.order_by(Servicio.nombre_servicio.asc()).offset(skip).limit(limit).all()


@router.get("/{servicio_id}", response_model=ServicioResponse)
def get_servicio(servicio_id: int, db: Session = Depends(get_db)):
    servicio = db.query(Servicio).filter(Servicio.id_servicio == servicio_id).first()
    if not servicio:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")
    return servicio


@router.post("/", response_model=ServicioResponse, status_code=201)
def create_servicio(data: ServicioCreate, db: Session = Depends(get_db)):
    servicio = Servicio(**data.dict())
    db.add(servicio)
    db.commit()
    db.refresh(servicio)
    return servicio


@router.put("/{servicio_id}", response_model=ServicioResponse)
def update_servicio(servicio_id: int, data: ServicioUpdate, db: Session = Depends(get_db)):
    servicio = db.query(Servicio).filter(Servicio.id_servicio == servicio_id).first()
    if not servicio:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")
    for key, value in data.dict(exclude_unset=True).items():
        setattr(servicio, key, value)
    db.commit()
    db.refresh(servicio)
    return servicio


@router.delete("/{servicio_id}")
def delete_servicio(servicio_id: int, db: Session = Depends(get_db)):
    servicio = db.query(Servicio).filter(Servicio.id_servicio == servicio_id).first()
    if not servicio:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")
    db.delete(servicio)
    db.commit()
    return {"message": "Servicio eliminado exitosamente"}
