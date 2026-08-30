from fastapi import APIRouter, Depends, HTTPException
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
    enviado = await send_contact_email(
        nombre=data.nombre,
        correo=data.correo,
        asunto=data.asunto,
        mensaje=data.mensaje,
    )

    if not enviado:
        raise HTTPException(
            status_code=502, detail="No pudimos enviar tu mensaje en este momento. Intenta de nuevo más tarde."
        )

    # Antes este mensaje solo se enviaba por correo y no quedaba registro en
    # ningún lado dentro de la plataforma — ahora también genera una
    # notificación real para el admin (ver ModuleNotificaciones).
    crear_notificacion(
        db,
        tipo="contacto",
        titulo=f"Nuevo mensaje de contacto: {data.asunto}",
        mensaje=f"{data.nombre} ({data.correo}): {data.mensaje}",
    )

    return {"ok": True, "message": "Mensaje enviado correctamente"}
