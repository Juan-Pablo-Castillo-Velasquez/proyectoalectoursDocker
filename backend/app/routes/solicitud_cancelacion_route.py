# Guardar como: backend/app/routes/solicitud_cancelacion_route.py

import asyncio
import contextlib
import logging
import threading
from datetime import UTC

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.cache import delete_pattern
from app.core.database import get_db
from app.core.deps import get_current_usuario
from app.core.mail import send_cancellation_email, send_email
from app.core.security import require_admin
from app.models.reserva_model import HistorialReserva, Reserva
from app.models.user_model import Usuario
from app.repositories.solicitud_cancelacion_repository import SolicitudCancelacionRepository
from app.schemas.notificacion_schema import ActividadClienteItem
from app.schemas.solicitud_cancelacion_schema import (
    SolicitudCancelacionCreate,
    SolicitudCancelacionResolve,
    SolicitudCancelacionResponse,
)
from app.services.notificacion_service import crear_notificacion, get_actividad_cliente

router = APIRouter(prefix="/api", tags=["Solicitudes de cancelación"])

logger = logging.getLogger(__name__)


def _enviar_cancelacion_en_hilo(email: str | None, reserva_id: int, guest_name: str) -> None:
    """
    Envia la confirmacion de cancelacion (Fase 2 del plan de mejora) en un
    hilo aparte, best-effort — mismo patron que
    reserva_route._enviar_confirmacion_reserva_en_hilo: send_cancellation_email
    ya existia en app/core/mail.py pero nunca se llamaba desde una ruta
    activa (solo en app/core/examples.py). No se calcula reembolso: no hay
    ninguna politica de reembolso real definida en el proyecto, así que no
    se inventa una acá — el correo sale sin ese monto.
    """
    if not email:
        return

    def _run() -> None:
        try:
            asyncio.run(
                send_cancellation_email(
                    email=email,
                    reservation_id=reserva_id,
                    guest_name=guest_name,
                )
            )
        except Exception as e:
            logger.error(f"No se pudo enviar el correo de cancelacion de la reserva #{reserva_id}: {e}")

    threading.Thread(target=_run, daemon=True).start()


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
        raise HTTPException(
            status_code=409, detail="Ya existe una solicitud de cancelación pendiente para esta reserva"
        )

    if data.motivo == "Otro motivo" and not (data.motivo_detalle and data.motivo_detalle.strip()):
        raise HTTPException(status_code=422, detail="Debes detallar el motivo cuando eliges 'Otro motivo'")

    solicitud = SolicitudCancelacionRepository.create(
        db,
        id_reserva=reserva_id,
        id_cliente=usuario.cliente.id_cliente,
        motivo=data.motivo,
        motivo_detalle=data.motivo_detalle,
    )

    # Notificación real para el admin — este es justamente el flujo que
    # antes "no llegaba" porque el frontend nunca llamaba a este endpoint
    # (ver ModalCancelacion.tsx); ahora que sí llega, además queda avisado
    # en el panel en vez de que el admin tenga que revisar el módulo a mano.
    crear_notificacion(
        db,
        tipo="cancelacion",
        titulo=f"Nueva solicitud de cancelación — Reserva #{reserva_id}",
        mensaje=data.motivo_detalle or data.motivo,
        id_referencia=reserva_id,
    )

    # Confirmación por correo al cliente (best-effort: si falla el envío,
    # la solicitud ya quedó guardada, no rompemos la respuesta por esto).
    if usuario.correo_electronico:
        with contextlib.suppress(Exception):
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

    return solicitud


@router.get(
    "/clientes/{cliente_id}/actividad",
    response_model=list[ActividadClienteItem],
)
def get_actividad_cliente_route(
    cliente_id: int,
    limit: int = Query(30, ge=1, le=100),
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_usuario),
):
    """
    Feed de notificaciones del cliente autenticado (campana del sitio
    público): cambios de estado de sus reservas + resoluciones de sus
    solicitudes de cancelación, más reciente primero. Protegido igual que
    /clientes/{cliente_id}/solicitudes-cancelacion — un cliente solo puede
    ver su propia actividad.
    """
    if not usuario.cliente or usuario.cliente.id_cliente != cliente_id:
        raise HTTPException(status_code=403, detail="No puedes ver la actividad de otro cliente")
    return get_actividad_cliente(db, cliente_id, limit)


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
    estado: str | None = Query(None),
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

    from datetime import datetime

    solicitud.estado = data.estado
    solicitud.comentario_resolucion = data.comentario_resolucion
    solicitud.fecha_resolucion = datetime.now(UTC)

    admin = db.query(Usuario).filter(Usuario.id_usuario == admin_id).first()
    if admin and admin.empleado:
        solicitud.id_empleado_resolutor = admin.empleado.id_empleado

    reserva_recien_cancelada = None
    if data.estado == "aprobada":
        reserva = db.query(Reserva).filter(Reserva.id_reserva == solicitud.id_reserva).first()
        if reserva and reserva.estado not in ("cancelada", "finalizada"):
            estado_anterior = reserva.estado
            reserva.estado = "cancelada"
            reserva_recien_cancelada = reserva
            db.add(
                HistorialReserva(
                    id_reserva=reserva.id_reserva,
                    estado_anterior=estado_anterior,
                    estado_nuevo="cancelada",
                    id_empleado_responsable=solicitud.id_empleado_resolutor,
                    comentarios=f"Cancelación aprobada: {data.comentario_resolucion or solicitud.motivo}",
                )
            )

    db.commit()
    db.refresh(solicitud)
    if data.estado == "aprobada":
        # Aprobar cancela de verdad la reserva vinculada (arriba) — el
        # listado de Reservas del admin (reserva_route.py) queda cacheado
        # hasta 60s si no se invalida acá.
        delete_pattern("reservas:list:*")
        # Los KPIs del dashboard (tasa de cancelación, tendencia de
        # cancelaciones, etc.) también deben reflejar esta cancelación real.
        delete_pattern("kpi:dashboard:resumen")

    # Confirmación por correo al cliente de que su reserva quedó cancelada
    # de verdad (Fase 2 del plan de mejora) — solo si en ESTA llamada de
    # verdad se aplicó el cambio (reserva_recien_cancelada), nunca si la
    # solicitud se marcó aprobada pero la reserva ya estaba cancelada por
    # otro lado.
    if reserva_recien_cancelada is not None:
        cliente = reserva_recien_cancelada.cliente
        _enviar_cancelacion_en_hilo(
            email=cliente.correo if cliente else None,
            reserva_id=reserva_recien_cancelada.id_reserva,
            guest_name=f"{cliente.nombre} {cliente.apellido}".strip() if cliente else "Cliente",
        )

    return solicitud
