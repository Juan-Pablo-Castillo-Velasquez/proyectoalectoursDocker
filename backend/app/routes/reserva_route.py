import uuid
from app.services.reserva_detail_service import ReservaDetailService
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import text
from app.core.database import get_db
from app.core.cache import get_cached, set_cached, delete_pattern
from app.core.exceptions import (
    ReservaDependencyError, PaqueteDependencyError, NotFoundError,
    HabitacionNoDisponibleError, HabitacionNoEncontradaError, PaqueteNoEncontradoError,
)
from app.schemas.reserva_schema import (
    PaqueteCreate, PaqueteUpdate, PaqueteResponse,
    PaqueteDetalleResponse, PaqueteHotelDetalle, PaqueteServicioDetalle,
    ReservaCreate, ReservaUpdate, ReservaResponse, ReservaDetailResponse,
    PagoCreate, PagoUpdate, PagoResponse,
    MetodoPagoCreate, MetodoPagoResponse,
    PagarRequest, PagarResponse,
)
from app.schemas.reserva_detail import (
    ReservaHabitacionDetail, ReservaServicioDetail, ReservaHistorialDetail,
    ActividadRecienteItem,
)
from app.repositories.reserva_repository import (
    PaqueteRepository, ReservaRepository, PagoRepository, MetodoPagoRepository
)
from app.models.reserva_model import Pago, MetodoPago, HistorialReserva, Paquete, PaqueteServicio, PaqueteHotel
from app.models.servicio_model import Servicio
from app.models.hotel_model import Hotel, HotelCaracteristica
from app.services import payment_service

router = APIRouter(prefix="/api", tags=["Reservas, Paquetes y Pagos"])

PAQUETES_CACHE_PATTERN = "paquetes:list:*"
RESERVAS_CACHE_PATTERN = "reservas:list:*"
PAGOS_CACHE_PATTERN = "pagos:list:*"
# Los métodos de pago casi nunca cambian (se crean una vez al configurar el
# sistema), así que van con TTL largo y una sola clave fija en vez de
# parametrizada — no hay skip/limit en este endpoint.
METODOS_PAGO_CACHE_KEY = "metodos_pago:list"


# ===================== PAQUETES CRUD =====================

@router.get("/paquetes", response_model=list[PaqueteResponse])
def get_paquetes(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    incluir_inactivos: bool = Query(False, description="Solo para el panel de admin: incluye paquetes desactivados"),
    db: Session = Depends(get_db)
):
    """Obtiene lista de paquetes activos (o todos, si incluir_inactivos=true).
    Cacheada 2 min — invalidada en cualquier alta/edición/baja de paquete."""
    cache_key = f"paquetes:list:{skip}:{limit}:{incluir_inactivos}"
    cached = get_cached(cache_key)
    if cached is not None:
        return cached

    paquetes = PaqueteRepository.get_all(db, skip, limit, incluir_inactivos)
    data = [PaqueteResponse.model_validate(p).model_dump(mode="json") for p in paquetes]
    set_cached(cache_key, data, ttl_seconds=120)
    return data

@router.get("/paquetes/populares")
def get_paquetes_populares(limit: int = 6, db: Session = Depends(get_db)):
    result = db.execute(
        text("SELECT * FROM vista_paquetes_populares LIMIT :limit"),
        {"limit": limit}
    ).fetchall()
    return [dict(r._mapping) for r in result]

@router.get("/paquetes/{paquete_id}", response_model=PaqueteResponse)
def get_paquete(paquete_id: int, db: Session = Depends(get_db)):
    """Obtiene detalles de un paquete"""
    paquete = PaqueteRepository.get_by_id(db, paquete_id)
    if not paquete:
        raise HTTPException(status_code=404, detail="Paquete no encontrado")
    return paquete


@router.get("/paquetes/{paquete_id}/detalle", response_model=PaqueteDetalleResponse)
def get_paquete_detalle(paquete_id: int, db: Session = Depends(get_db)):
    """
    Igual que GET /paquetes/{id} pero enriquecido con los destinos, hoteles
    (con sus características reales) y servicios incluidos del paquete —
    usado por la página de detalle del frontend, que antes mostraba datos
    de ejemplo hardcodeados (vuelos, horarios y hoteles inventados) desde
    data/packages.ts en vez de la información real de la base de datos.
    """
    paquete = (
        db.query(Paquete)
        .options(
            joinedload(Paquete.paquete_servicios).joinedload(PaqueteServicio.servicio).joinedload(Servicio.categoria),
            joinedload(Paquete.paquete_servicios).joinedload(PaqueteServicio.servicio).joinedload(Servicio.destino),
            joinedload(Paquete.paquete_hotel).joinedload(PaqueteHotel.hotel).joinedload(Hotel.hotel_caracteristicas).joinedload(HotelCaracteristica.caracteristica),
        )
        .filter(Paquete.id_paquete == paquete_id)
        .first()
    )
    if not paquete:
        raise HTTPException(status_code=404, detail="Paquete no encontrado")

    destinos = sorted({
        ps.servicio.destino.nombre_destino
        for ps in paquete.paquete_servicios
        if ps.servicio and ps.servicio.destino
    })

    hoteles = [
        PaqueteHotelDetalle(
            id_hotel=ph.hotel.id_hotel,
            nombre_hotel=ph.hotel.nombre_hotel,
            ciudad=ph.hotel.ciudad,
            pais=ph.hotel.pais,
            calificacion=ph.hotel.calificacion,
            noches_incluidas=ph.noches_incluidas,
            caracteristicas=sorted({
                hc.caracteristica.nombre_caracteristica
                for hc in ph.hotel.hotel_caracteristicas
                if hc.disponible and hc.caracteristica
            }),
        )
        for ph in paquete.paquete_hotel
        if ph.hotel
    ]

    servicios = [
        PaqueteServicioDetalle(
            nombre_servicio=ps.servicio.nombre_servicio,
            categoria=ps.servicio.categoria.nombre_categoria if ps.servicio.categoria else None,
            descripcion=ps.servicio.descripcion,
            dia_actividad=ps.dia_actividad,
            incluido=ps.incluido if ps.incluido is not None else True,
        )
        for ps in paquete.paquete_servicios
        if ps.servicio
    ]

    return PaqueteDetalleResponse(
        id_paquete=paquete.id_paquete,
        nombre_paquete=paquete.nombre_paquete,
        descripcion=paquete.descripcion,
        duracion_dias=paquete.duracion_dias,
        precio_base=float(paquete.precio_base),
        activo=paquete.activo,
        destinos=destinos,
        hoteles=hoteles,
        servicios=servicios,
    )


@router.post("/paquetes", response_model=PaqueteResponse, status_code=201)
def create_paquete(paquete: PaqueteCreate, db: Session = Depends(get_db)):
    """Crea un nuevo paquete turístico"""
    nuevo = PaqueteRepository.create(db, paquete.dict())
    delete_pattern(PAQUETES_CACHE_PATTERN)
    return nuevo


@router.put("/paquetes/{paquete_id}", response_model=PaqueteResponse)
def update_paquete(paquete_id: int, paquete: PaqueteUpdate, db: Session = Depends(get_db)):
    """Actualiza un paquete existente"""
    db_paquete = PaqueteRepository.get_by_id(db, paquete_id)
    if not db_paquete:
        raise HTTPException(status_code=404, detail="Paquete no encontrado")
    actualizado = PaqueteRepository.update(db, paquete_id, paquete.dict(exclude_unset=True))
    delete_pattern(PAQUETES_CACHE_PATTERN)
    return actualizado


@router.delete("/paquetes/{paquete_id}")
def delete_paquete(paquete_id: int, db: Session = Depends(get_db)):
    """Desactiva un paquete"""
    try:
        PaqueteRepository.delete(db, paquete_id)
        delete_pattern(PAQUETES_CACHE_PATTERN)
        return {"message": "Paquete desactivado exitosamente"}
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=e.detail)
    except PaqueteDependencyError as e:
        raise HTTPException(status_code=409, detail=e.detail)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ===================== RESERVAS CRUD =====================

@router.get("/reservas", response_model=list[ReservaResponse])
def get_reservas(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Obtiene lista de reservas. Cacheada solo 60s (más corto que
    hoteles/paquetes/clientes) porque una reserva cambia por muchos caminos
    distintos — crear/editar/eliminar, pagar, confirmar un pago, y aprobar
    una solicitud de cancelación (ver los `delete_pattern` en cada uno más
    abajo y en solicitud_cancelacion_route.py) — un TTL corto acota el
    impacto de cualquier camino de escritura que se nos escape."""
    cache_key = f"reservas:list:{skip}:{limit}"
    cached = get_cached(cache_key)
    if cached is not None:
        return cached

    reservas = ReservaRepository.get_all(db, skip, limit)
    data = [ReservaResponse.model_validate(r).model_dump(mode="json") for r in reservas]
    set_cached(cache_key, data, ttl_seconds=60)
    return data


@router.get("/reservas/cliente/{cliente_id}", response_model=list[ReservaResponse])
def get_reservas_cliente(
    cliente_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Obtiene reservas de un cliente"""
    return ReservaRepository.get_by_cliente(db, cliente_id, skip, limit)


@router.get("/reservas/estado/{estado}", response_model=list[ReservaResponse])
def get_reservas_estado(
    estado: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Obtiene reservas por estado"""
    if estado not in ["pendiente", "confirmada", "cancelada", "finalizada"]:
        raise HTTPException(status_code=400, detail="Estado inválido")
    return ReservaRepository.get_by_estado(db, estado, skip, limit)


# ⚠️ IMPORTANTE: estos tres endpoints específicos van ANTES de /reservas/{reserva_id}
# para que FastAPI no los confunda con el parámetro dinámico

@router.get("/reservas/{reserva_id}/habitaciones", response_model=list[ReservaHabitacionDetail])
def get_habitaciones_reserva(reserva_id: int, db: Session = Depends(get_db)):
    """Obtiene habitaciones asociadas a una reserva"""
    return ReservaDetailService.get_habitaciones(db, reserva_id)


@router.get("/reservas/{reserva_id}/servicios", response_model=list[ReservaServicioDetail])
def get_servicios_reserva(reserva_id: int, db: Session = Depends(get_db)):
    """Obtiene servicios asociados a una reserva"""
    return ReservaDetailService.get_servicios(db, reserva_id)


@router.get("/reservas/{reserva_id}/historial", response_model=list[ReservaHistorialDetail])
def get_historial_reserva(reserva_id: int, db: Session = Depends(get_db)):
    """Obtiene historial de cambios de una reserva"""
    return ReservaDetailService.get_historial(db, reserva_id)


@router.get("/historial-reservas/recientes", response_model=list[ActividadRecienteItem])
def get_actividad_reciente(
    limit: int = Query(15, ge=1, le=50),
    db: Session = Depends(get_db),
):
    """
    Feed de 'Actividad reciente' para el Dashboard de admin: últimos
    cambios de estado registrados en TODAS las reservas (confirmaciones,
    cancelaciones, pagos aprobados/rechazados...), más recientes primero.
    Reutiliza la misma tabla historial_reservas que ya alimenta
    GET /reservas/{id}/historial — no agrega ninguna tabla ni columna
    nueva a la base de datos, solo una consulta agregada de solo lectura.
    """
    return ReservaDetailService.get_historial_reciente(db, limit)


@router.get("/reservas/{reserva_id}", response_model=ReservaDetailResponse)
def get_reserva(reserva_id: int, db: Session = Depends(get_db)):
    """Obtiene detalles completos de una reserva con paquete, pagos y habitaciones"""
    reserva = ReservaRepository.get_by_id(db, reserva_id)
    if not reserva:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")
    return reserva


@router.post("/reservas", response_model=ReservaResponse, status_code=201)
def create_reserva(reserva: ReservaCreate, db: Session = Depends(get_db)):
    """
    Crea una nueva reserva.

    Si `habitaciones` viene incluido, el backend:
    - Verifica que cada habitación exista y no esté en mantenimiento
    - Verifica que no haya otra reserva activa cruzando esas fechas (409 si la hay)
    - Calcula el precio con el valor REAL de la habitación en la BD (ignora cualquier
      precio que mande el frontend, para evitar manipulación)
    """
    try:
        nueva = ReservaRepository.create(db, reserva.dict())
        delete_pattern(RESERVAS_CACHE_PATTERN)
        return nueva
    except HabitacionNoDisponibleError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)
    except HabitacionNoEncontradaError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)
    except PaqueteNoEncontradoError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/reservas/{reserva_id}/pagar", response_model=PagarResponse)
def pagar_reserva(reserva_id: int, data: PagarRequest, db: Session = Depends(get_db)):
    """
    Inicia el pago de una reserva (100% simulado, sin pasarela real). El
    monto SIEMPRE se calcula en el backend a partir del precio real de
    habitaciones/servicios ya guardados en la reserva — nunca se acepta un
    monto propuesto por el cliente.

    Segun el metodo:
    - Tarjeta / PayPal / otros: resuelve al instante (aprobado o rechazado
      con los valores de prueba de payment_service).
    - PSE / Nequi: el pago queda en estado 'procesando' y la reserva sigue
      'pendiente' hasta que el frontend llama a
      POST /api/pagos/{id}/confirmar (simula la confirmacion del banco o
      la app, que en la vida real llega despues, de forma asincrona).
    """
    reserva = ReservaRepository.get_by_id(db, reserva_id)
    if not reserva:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")

    if reserva.estado != "pendiente":
        raise HTTPException(
            status_code=409,
            detail=f"Esta reserva ya está en estado '{reserva.estado}', no se puede pagar de nuevo",
        )

    metodo = db.query(MetodoPago).filter(MetodoPago.id_metodo == data.id_metodo_pago).first()
    if not metodo:
        raise HTTPException(status_code=404, detail="Método de pago no encontrado")

    total = reserva.precio_total
    if total <= 0:
        raise HTTPException(
            status_code=422,
            detail="Esta reserva no tiene habitaciones ni servicios asociados, no hay nada que cobrar",
        )
    monto = total if data.tipo_pago == "completo" else round(total * 0.5, 2)

    rechazo_simulado = payment_service.debe_simular_rechazo(metodo.codigo, data)
    es_async = payment_service.es_pago_asincrono(metodo.codigo)

    if es_async:
        estado_pago = "procesando"
    elif rechazo_simulado:
        estado_pago = "rechazado"
    else:
        estado_pago = "pagado"

    pago = Pago(
        id_reserva=reserva_id,
        id_metodo_pago=data.id_metodo_pago,
        monto=monto,
        referencia=f"PAY-{uuid.uuid4().hex[:10].upper()}",
        estado=estado_pago,
        simular_rechazo=rechazo_simulado,
    )
    db.add(pago)

    if not es_async:
        estado_anterior = reserva.estado
        if not rechazo_simulado:
            reserva.estado = "confirmada"
            comentario = f"Pago {data.tipo_pago} aprobado (simulado) por ${monto:,.0f}"
        else:
            comentario = f"Pago {data.tipo_pago} rechazado (simulado) por ${monto:,.0f}"
        db.add(HistorialReserva(
            id_reserva=reserva_id,
            estado_anterior=estado_anterior,
            estado_nuevo=reserva.estado,
            comentarios=comentario,
        ))

    db.commit()
    db.refresh(pago)
    db.refresh(reserva)
    delete_pattern(RESERVAS_CACHE_PATTERN)
    delete_pattern(PAGOS_CACHE_PATTERN)

    return PagarResponse(pago=pago, reserva=reserva)


@router.post("/pagos/{pago_id}/confirmar", response_model=PagarResponse)
def confirmar_pago(pago_id: int, db: Session = Depends(get_db)):
    """
    Confirma un pago que quedo 'procesando' (PSE/Nequi) — simula que el
    banco o la app ya respondieron. El resultado (aprobado/rechazado) ya
    fue decidido al iniciar el pago (ver `pagar_reserva`), aqui solo se
    aplica y se actualiza la reserva + el historial.
    """
    pago = db.query(Pago).filter(Pago.id_pago == pago_id).first()
    if not pago:
        raise HTTPException(status_code=404, detail="Pago no encontrado")
    if pago.estado != "procesando":
        raise HTTPException(
            status_code=409,
            detail=f"Este pago ya está en estado '{pago.estado}', no hay nada que confirmar",
        )

    reserva = ReservaRepository.get_by_id(db, pago.id_reserva)
    if not reserva:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")

    estado_anterior = reserva.estado

    if pago.simular_rechazo:
        pago.estado = "rechazado"
        comentario = f"Pago confirmado como rechazado (simulado) por ${pago.monto:,.0f}"
    else:
        pago.estado = "pagado"
        reserva.estado = "confirmada"
        comentario = f"Pago confirmado y aprobado (simulado) por ${pago.monto:,.0f}"

    db.add(HistorialReserva(
        id_reserva=reserva.id_reserva,
        estado_anterior=estado_anterior,
        estado_nuevo=reserva.estado,
        comentarios=comentario,
    ))

    db.commit()
    db.refresh(pago)
    db.refresh(reserva)
    delete_pattern(RESERVAS_CACHE_PATTERN)
    delete_pattern(PAGOS_CACHE_PATTERN)

    return PagarResponse(pago=pago, reserva=reserva)


@router.put("/reservas/{reserva_id}", response_model=ReservaResponse)
def update_reserva(reserva_id: int, reserva: ReservaUpdate, db: Session = Depends(get_db)):
    """Actualiza una reserva existente"""
    db_reserva = ReservaRepository.get_by_id(db, reserva_id)
    if not db_reserva:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")
    actualizada = ReservaRepository.update(db, reserva_id, reserva.dict(exclude_unset=True))
    delete_pattern(RESERVAS_CACHE_PATTERN)
    return actualizada


@router.delete("/reservas/{reserva_id}")
def delete_reserva(reserva_id: int, db: Session = Depends(get_db)):
    """Elimina una reserva"""
    try:
        ReservaRepository.delete(db, reserva_id)
        delete_pattern(RESERVAS_CACHE_PATTERN)
        return {"message": "Reserva eliminada exitosamente"}
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=e.detail)
    except ReservaDependencyError as e:
        raise HTTPException(status_code=409, detail=e.detail)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ===================== MÉTODOS DE PAGO CRUD =====================

@router.get("/metodos-pago", response_model=list[MetodoPagoResponse])
def get_metodos_pago(db: Session = Depends(get_db)):
    """Obtiene todos los métodos de pago disponibles. Cacheada 300s — lista
    casi estática, se invalida solo si se crea un método nuevo."""
    cached = get_cached(METODOS_PAGO_CACHE_KEY)
    if cached is not None:
        return cached

    metodos = MetodoPagoRepository.get_all(db)
    data = [MetodoPagoResponse.model_validate(m).model_dump(mode="json") for m in metodos]
    set_cached(METODOS_PAGO_CACHE_KEY, data, ttl_seconds=300)
    return data


@router.post("/metodos-pago", response_model=MetodoPagoResponse, status_code=201)
def create_metodo_pago(metodo: MetodoPagoCreate, db: Session = Depends(get_db)):
    """Crea un nuevo método de pago"""
    nuevo = MetodoPagoRepository.create(db, metodo.dict())
    delete_pattern(METODOS_PAGO_CACHE_KEY)
    return nuevo


# ===================== PAGOS CRUD =====================

@router.get("/pagos", response_model=list[PagoResponse])
def get_pagos(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Obtiene lista de pagos. Cacheada 60s — mismo criterio de TTL corto que
    reservas, ya que un pago cambia de estado por varios caminos."""
    cache_key = f"pagos:list:{skip}:{limit}"
    cached = get_cached(cache_key)
    if cached is not None:
        return cached

    pagos = PagoRepository.get_all(db, skip, limit)
    data = [PagoResponse.model_validate(p).model_dump(mode="json") for p in pagos]
    set_cached(cache_key, data, ttl_seconds=60)
    return data


@router.get("/pagos/reserva/{reserva_id}", response_model=list[PagoResponse])
def get_pagos_reserva(reserva_id: int, db: Session = Depends(get_db)):
    """Obtiene pagos de una reserva"""
    return PagoRepository.get_by_reserva(db, reserva_id)


@router.get("/pagos/estado/{estado}", response_model=list[PagoResponse])
def get_pagos_estado(
    estado: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Obtiene pagos por estado"""
    if estado not in ["pendiente", "pagado", "rechazado"]:
        raise HTTPException(status_code=400, detail="Estado inválido")
    return PagoRepository.get_by_estado(db, estado, skip, limit)


@router.get("/pagos/{pago_id}", response_model=PagoResponse)
def get_pago(pago_id: int, db: Session = Depends(get_db)):
    """Obtiene detalles de un pago"""
    pago = PagoRepository.get_by_id(db, pago_id)
    if not pago:
        raise HTTPException(status_code=404, detail="Pago no encontrado")
    return pago


@router.post("/pagos", response_model=PagoResponse, status_code=201)
def create_pago(pago: PagoCreate, db: Session = Depends(get_db)):
    """Crea un nuevo pago"""
    nuevo = PagoRepository.create(db, pago.dict())
    delete_pattern(PAGOS_CACHE_PATTERN)
    return nuevo


@router.put("/pagos/{pago_id}", response_model=PagoResponse)
def update_pago(pago_id: int, pago: PagoUpdate, db: Session = Depends(get_db)):
    """Actualiza un pago existente"""
    db_pago = PagoRepository.get_by_id(db, pago_id)
    if not db_pago:
        raise HTTPException(status_code=404, detail="Pago no encontrado")
    actualizado = PagoRepository.update(db, pago_id, pago.dict(exclude_unset=True))
    delete_pattern(PAGOS_CACHE_PATTERN)
    delete_pattern(RESERVAS_CACHE_PATTERN)  # el estado de pago se ve en la tabla de Reservas
    return actualizado


@router.delete("/pagos/{pago_id}")
def delete_pago(pago_id: int, db: Session = Depends(get_db)):
    """Elimina un pago"""
    try:
        PagoRepository.delete(db, pago_id)
        delete_pattern(PAGOS_CACHE_PATTERN)
        delete_pattern(RESERVAS_CACHE_PATTERN)
        return {"message": "Pago eliminado exitosamente"}
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=e.detail)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))