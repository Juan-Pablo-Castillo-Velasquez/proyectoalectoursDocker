from fastapi import APIRouter, Depends
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.mail import send_contact_email
from app.services.notificacion_service import crear_notificacion

router = APIRouter(prefix="/api/contacto", tags=["Contacto"])


class ContactoRequest(BaseModel):
    nombre: str = Field(..., min_length=2, max_length=100)
    correo: EmailStr
    asunto: str = Field(..., min_length=3, max_length=150)
    mensaje: str = Field(..., min_length=10, max_length=2000)


@router.post("")
async def enviar_contacto(data: ContactoRequest, db: Session = Depends(get_db)):
    # El mensaje queda registrado como notificación real dentro de la
    # plataforma primero (ver ModuleNotificaciones) -- esto es lo único que
    # de verdad garantiza que soporte se entere, sin depender de que un
    # correo llegue. Antes esto solo pasaba SI el correo se enviaba bien
    # (`if not enviado: raise ...` cortaba antes de llegar aquí), así que un
    # correo perdido por Gmail (transitorio, no significa que el formulario
    # esté roto) también se llevaba consigo el registro del mensaje.
    crear_notificacion(
        db,
        tipo="contacto",
        titulo=f"Nuevo mensaje de contacto: {data.asunto}",
        mensaje=f"{data.nombre} ({data.correo}): {data.mensaje}",
    )

    # El correo (copia a soporte + confirmación al remitente) es un
    # complemento best-effort: ya no puede tumbar la solicitud completa con
    # un 502 -- el mensaje del cliente siempre llega a la plataforma pase lo
    # que pase con el envío de correo (ver send_contact_email en mail.py).
    await send_contact_email(
        nombre=data.nombre,
        correo=data.correo,
        asunto=data.asunto,
        mensaje=data.mensaje,
    )

    return {"ok": True, "message": "Mensaje enviado correctamente"}
