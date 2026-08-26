# Guardar como: backend/app/routes/solicitud_cancelacion_route.py

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Header, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_user_from_token, require_admin
from app.core.mail import send_email
from app.models.user_model import Usuario
from app.models.reserva_model import Reserva, HistorialReserva
from app.schemas.solicitud_cancelacion_schema import (
    SolicitudCancelacionCreate,
    SolicitudCancelacionResponse,
    SolicitudCancelacionResolve,
)
from app.repositories.solicitud_cancelacion_repository import SolicitudCancelacionRepository

router = APIRouter(prefix="/api", tags=["Solicitudes de cancelación"])


def get_current_usuario(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)) -> Usuario:
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


@router.post(
    "/reservas/{reserva_id}/solicitud-cancelacion",
    response_model=SolicitudCancelacionResponse,
    status_code=201,
)
async def crear_solicitud_cancelacion(
    reserva_id: int,
    data: SolicitudCancelacionCreate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_usuario),
):
    """
    El cliente autenticado envía una solicitud de cancelación para una de
    SUS reservas. Queda en estado 'pendiente' hasta que un asesor la
    apruebe o rechace (eso lo hará el futuro panel de admin).
    """
    if not usuario.cliente:
        raise HTTPException(status_code=403, detail="Solo los clientes pueden solicitar cancelaciones")

    reserva = db.query(Reserva).filter(Reserva.id_reserva == reserva_id).first()
    if not reserva:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")

    if reserva.id_cliente != usuario.cliente.id_cliente:
        raise HTTPException(status_code=403, detail="No puedes solicitar la cancelación de una reserva que no es tuya")

    if reserva.estado in ("cancelada", "finalizada"):
        raise HTTPException(
            status_code=409,
            detail=f"No se puede solicitar cancelación: la reserva ya está '{reserva.estado}'",
        )

    if SolicitudCancelacionRepository.get_pendiente_by_reserva(db, reserva_id):
        raise HTTPException(status_code=409, detail="Ya existe una solicitud de cancelación pendiente para esta reserva")

    if data.motivo == "Otro motivo" and not (data.motivo_detalle and data.motivo_detalle.strip()):
        raise HTTPException(status_code=422, detail="Debes detallar el motivo cuando eliges 'Otro motivo'")

    solicitud = SolicitudCancelacionRepository.create(
        db,
        id_reserva=reserva_id,
        id_cliente=usuario.cliente.id_cliente,
        motivo=data.motivo,
        motivo_detalle=data.motivo_detalle,
    )

    # Confirmación por correo al cliente (best-effort: si falla el envío,
    # la solicitud ya quedó guardada, no rompemos la respuesta por esto).
    if usuario.correo_electronico:
        try:
            await send_email(
                email=usuario.correo_electronico,
                subject=f"Recibimos tu solicitud de cancelación - Reserva #{reserva_id} - AlecTours",
                body=(
                    f"Hola,\n\nRecibimos tu solicitud de cancelación para la reserva #{reserva_id}.\n"
                    f"Motivo: {data.motivo}\n\n"
                    "Un asesor la revisará y te avisaremos por este medio con la resolución.\n\n"
                    "Saludos,\nEl equipo de AlecTours"
                ),
                html_body=(
                    f"<p>Hola,</p><p>Recibimos tu solicitud de cancelación para la reserva "
                    f"<strong>#{reserva_id}</strong>.</p><p>Motivo: <strong>{data.motivo}</strong></p>"
                    "<p>Un asesor la revisará y te avisaremos por este medio con la resolución.</p>"
                    "<p>Saludos,<br>El equipo de AlecTours</p>"
                ),
            )
        except Exception:
            pass

    return solicitud


@router.get(
    "/clientes/{cliente_id}/solicitudes-cancelacion",
    response_model=list[SolicitudCancelacionResponse],
)
def get_solicitudes_cliente(
    cliente_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_usuario),
):
    """Historial de solicitudes de cancelación del cliente autenticado."""
    if not usuario.cliente or usuario.cliente.id_cliente != cliente_id:
        raise HTTPException(status_code=403, detail="No puedes ver las solicitudes de otro cliente")

    return SolicitudCancelacionRepository.get_by_cliente(db, cliente_id, skip, limit)


# ===================== ADMIN =====================

@router.get("/solicitudes-cancelacion", response_model=list[SolicitudCancelacionResponse])
def admin_get_solicitudes(
    estado: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    db: Session = Depends(get_db),
    _admin: int = Depends(require_admin),
):
    """Cola de solicitudes de cancelación para el panel de admin (pendientes primero)."""
    return SolicitudCancelacionRepository.get_all(db, estado=estado, skip=skip, limit=limit)


@router.put("/solicitudes-cancelacion/{id_solicitud}/resolver", response_model=SolicitudCancelacionResponse)
def admin_resolver_solicitud(
    id_solicitud: int,
    data: SolicitudCancelacionResolve,
    db: Session = Depends(get_db),
    admin_id: int = Depends(require_admin),
):
    """
    Aprueba o rechaza una solicitud de cancelación, con nota del admin.
    Aprobar cancela de verdad la reserva (y queda trazado en su historial);
    rechazar solo cierra la solicitud, la reserva sigue como estaba.
    """
    solicitud = SolicitudCancelacionRepository.get_by_id(db, id_solicitud)
    if not solicitud:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")
    if solicitud.estado != "pendiente":
        raise HTTPException(status_code=409, detail=f"Esta solicitud ya fue '{solicitud.estado}'")

    from datetime import datetime, timezone

    solicitud.estado = data.estado
    solicitud.comentario_resolucion = data.comentario_resolucion
    solicitud.fecha_resolucion = datetime.now(timezone.utc)

    admin = db.query(Usuario).filter(Usuario.id_usuario == admin_id).first()
    if admin and admin.empleado:
        solicitud.id_empleado_resolutor = admin.empleado.id_empleado

    if data.estado == "aprobada":
        reserva = db.query(Reserva).filter(Reserva.id_reserva == solicitud.id_reserva).first()
        if reserva and reserva.estado not in ("cancelada", "finalizada"):
            estado_anterior = reserva.estado
            reserva.estado = "cancelada"
            db.add(HistorialReserva(
                id_reserva=reserva.id_reserva,
                estado_anterior=estado_anterior,
                estado_nuevo="cancelada",
                id_empleado_responsable=solicitud.id_empleado_resolutor,
                comentarios=f"Cancelación aprobada: {data.comentario_resolucion or solicitud.motivo}",
            ))

    db.commit()
    db.refresh(solicitud)
    return solicitud