from fastapi import APIRouter, Depends, HTTPException, Header, Query
from sqlalchemy.orm import Session, joinedload
from pydantic import BaseModel
from typing import List, Optional

from app.core.database import get_db
from app.core.security import get_current_user as get_current_user_id, get_user_from_token
from app.models.cliente_model import PreferenciaCliente
from app.models.user_model import Usuario
from app.models.reserva_model import Paquete, PaqueteServicio, PaqueteHotel
from app.models.servicio_model import Servicio
from app.schemas.reserva_schema import PaqueteResponse


def get_current_usuario(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)) -> Usuario:
    """Obtiene el usuario actual desde el token JWT"""
    if not authorization:
        raise HTTPException(status_code=401, detail="No autenticado")
    
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=401, detail="Token inválido")
    
    token = parts[1]
    user_id = get_user_from_token(token)
    
    if user_id is None:
        raise HTTPException(status_code=401, detail="Token expirado o inválido")
    
    user = db.query(Usuario).filter(Usuario.id_usuario == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    return user

router = APIRouter(
    prefix="/api/preferencias-cliente",
    tags=["Preferencias"]
)


class PreferenciaCreate(BaseModel):
    id_cliente: int
    intereses: Optional[List[str]] = []
    compania: Optional[str] = None
    presupuesto: Optional[str] = None
    clima: Optional[str] = None
    ritmo: Optional[str] = None
    transporte: Optional[str] = None


class PreferenciaResponse(BaseModel):
    id_preferencia: int
    id_cliente: int
    intereses: Optional[List[str]] = []
    compania: Optional[str] = None
    presupuesto: Optional[str] = None
    clima: Optional[str] = None
    ritmo: Optional[str] = None
    transporte: Optional[str] = None

    class Config:
        from_attributes = True


@router.post("/", response_model=PreferenciaResponse, status_code=201)
def create_preferencia(data: PreferenciaCreate, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_usuario)):
    # Validar que el usuario está autenticado
    if not current_user:
        raise HTTPException(status_code=401, detail="No autenticado")
    
    # Si el usuario no tiene id_cliente, rechazar
    if not current_user.id_cliente:
        raise HTTPException(status_code=400, detail="Debes completar tu perfil de cliente primero")
    
    # Validar que el id_cliente pertenece al usuario autenticado
    if current_user.id_cliente != data.id_cliente:
        raise HTTPException(status_code=403, detail="No tienes permiso para guardar preferencias de otro cliente")
    
    existente = db.query(PreferenciaCliente).filter(
        PreferenciaCliente.id_cliente == data.id_cliente
    ).first()
    if existente:
        # Actualiza si ya existe
        for key, value in data.dict(exclude={"id_cliente"}).items():
            setattr(existente, key, value)
        db.commit()
        db.refresh(existente)
        return existente

    preferencia = PreferenciaCliente(**data.dict())
    db.add(preferencia)
    db.commit()
    db.refresh(preferencia)
    return preferencia


@router.get("/{cliente_id}", response_model=PreferenciaResponse)
def get_preferencia(cliente_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_usuario)):
    # Validar que el usuario está autenticado
    if not current_user:
        raise HTTPException(status_code=401, detail="No autenticado")

    preferencia = db.query(PreferenciaCliente).filter(
        PreferenciaCliente.id_cliente == cliente_id
    ).first()
    if not preferencia:
        raise HTTPException(status_code=404, detail="Preferencias no encontradas")
    return preferencia


# ─── Motor de sugerencias de paquetes ──────────────────────────────────────

# Palabras clave asociadas a cada interés, usadas para puntuar coincidencias
# contra la categoría del servicio, su descripción y la descripción del
# destino asociado (los datos semilla no tienen una relación directa
# interés -> categoría, así que se aproxima por texto).
_KEYWORDS_INTERES = {
    "beach": ["playa", "mar", "isla", "buceo", "caribe"],
    "nature": ["ecoturismo", "natural", "senderismo", "caminata", "valle", "desierto", "río", "reserva"],
    "culture": ["cultura", "museo", "histór", "religios", "patrimonio"],
    "food": ["gastronom"],
    "adventure": ["aventura", "deporte", "escalada", "extremo", "buceo"],
    "wellness": ["spa", "relaj", "bienestar", "descanso"],
}

_RANGOS_PRESUPUESTO = {
    "low": (0, 800000),
    "mid": (800000, 1300000),
    "high": (1300000, float("inf")),
}


class PaqueteSugeridoResponse(PaqueteResponse):
    destinos: List[str] = []
    hoteles: List[str] = []


def _score_paquete(paquete: Paquete, preferencia: PreferenciaCliente) -> int:
    score = 0
    precio = float(paquete.precio_base)

    # Presupuesto: puntos si cae en el rango del cliente, mitad si es adyacente
    if preferencia.presupuesto in _RANGOS_PRESUPUESTO:
        lo, hi = _RANGOS_PRESUPUESTO[preferencia.presupuesto]
        if lo <= precio < hi:
            score += 3
        else:
            score += 1

    # Ritmo: viajes largos (más días) para "relax", cortos para "active"
    if paquete.duracion_dias:
        if preferencia.ritmo == "relax" and paquete.duracion_dias >= 4:
            score += 1
        elif preferencia.ritmo == "active" and paquete.duracion_dias <= 4:
            score += 1

    # Intereses: busca coincidencias de texto en categoría/servicio/destino
    intereses = preferencia.intereses or []
    textos = []
    for ps in paquete.paquete_servicios:
        servicio = ps.servicio
        if not servicio:
            continue
        if servicio.categoria:
            textos.append(servicio.categoria.nombre_categoria)
        if servicio.descripcion:
            textos.append(servicio.descripcion)
        if servicio.destino and servicio.destino.descripcion:
            textos.append(servicio.destino.descripcion)
    texto_completo = " ".join(textos).lower()

    for interes in intereses:
        for keyword in _KEYWORDS_INTERES.get(interes, []):
            if keyword in texto_completo:
                score += 2
                break

    return score


@router.get("/{cliente_id}/sugerencias", response_model=List[PaqueteSugeridoResponse])
def get_sugerencias(
    cliente_id: int,
    limit: int = Query(6, ge=1, le=20),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_usuario),
):
    """
    Recomienda paquetes activos según las preferencias guardadas del cliente
    (presupuesto, ritmo de viaje e intereses), con una puntuación simple y
    explicable: coincidencia de rango de precio, duración del viaje vs. ritmo,
    y coincidencia de intereses contra categorías/descripciones de servicios.
    """
    if current_user.id_cliente != cliente_id:
        raise HTTPException(status_code=403, detail="No tienes permiso para ver sugerencias de otro cliente")

    preferencia = db.query(PreferenciaCliente).filter(
        PreferenciaCliente.id_cliente == cliente_id
    ).first()
    if not preferencia:
        raise HTTPException(
            status_code=404,
            detail="Aún no has completado tus preferencias de viaje. Complétalas para recibir sugerencias.",
        )

    paquetes = (
        db.query(Paquete)
        .filter(Paquete.activo.is_(True))
        .options(
            joinedload(Paquete.paquete_servicios)
            .joinedload(PaqueteServicio.servicio)
            .joinedload(Servicio.categoria),
            joinedload(Paquete.paquete_servicios)
            .joinedload(PaqueteServicio.servicio)
            .joinedload(Servicio.destino),
            joinedload(Paquete.paquete_hotel).joinedload(PaqueteHotel.hotel),
        )
        .all()
    )

    puntuados = [(paquete, _score_paquete(paquete, preferencia)) for paquete in paquetes]
    puntuados.sort(key=lambda par: (-par[1], float(par[0].precio_base)))

    resultado = []
    for paquete, _score in puntuados[:limit]:
        destinos = sorted({
            ps.servicio.destino.nombre_destino
            for ps in paquete.paquete_servicios
            if ps.servicio and ps.servicio.destino
        })
        hoteles = sorted({
            ph.hotel.nombre_hotel
            for ph in paquete.paquete_hotel
            if ph.hotel
        })
        resultado.append(
            PaqueteSugeridoResponse(
                id_paquete=paquete.id_paquete,
                nombre_paquete=paquete.nombre_paquete,
                descripcion=paquete.descripcion,
                duracion_dias=paquete.duracion_dias,
                precio_base=float(paquete.precio_base),
                activo=paquete.activo,
                destinos=destinos,
                hoteles=hoteles,
            )
        )
    return resultado