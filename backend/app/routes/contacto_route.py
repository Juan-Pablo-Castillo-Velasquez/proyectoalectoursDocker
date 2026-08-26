from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr, Field

from app.core.mail import send_contact_email

router = APIRouter(prefix="/api/contacto", tags=["Contacto"])


class ContactoRequest(BaseModel):
    nombre: str = Field(..., min_length=2, max_length=100)
    correo: EmailStr
    asunto: str = Field(..., min_length=3, max_length=150)
    mensaje: str = Field(..., min_length=10, max_length=2000)


@router.post("")
async def enviar_contacto(data: ContactoRequest):
    enviado = await send_contact_email(
        nombre=data.nombre,
        correo=data.correo,
        asunto=data.asunto,
        mensaje=data.mensaje,
    )

    if not enviado:
        raise HTTPException(
            status_code=502,
            detail="No pudimos enviar tu mensaje en este momento. Intenta de nuevo más tarde."
        )

    return {"ok": True, "message": "Mensaje enviado correctamente"}