from typing import Optional
from sqlalchemy.orm import Session
from app.models.notificacion_model import Notificacion


def crear_notificacion(
    db: Session,
    tipo: str,
    titulo: str,
    mensaje: Optional[str] = None,
    id_referencia: Optional[int] = None,
) -> None:
    """Crea una notificación real para el admin, llamada desde el punto
    exacto donde ocurre el evento (nueva solicitud de cancelación, mensaje
    de contacto, solicitud corporativa, pago aprobado...) — nunca con datos
    inventados. Sin caché: el conteo de no leídas debe reflejar el estado
    real al instante, no un valor con TTL."""
    db.add(Notificacion(tipo=tipo, titulo=titulo, mensaje=mensaje, id_referencia=id_referencia))
    db.commit()
