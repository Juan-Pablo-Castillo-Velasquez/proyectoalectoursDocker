from sqlalchemy import TIMESTAMP, CheckConstraint, Column, Integer, String, Text, func

from app.core.database import Base


class SolicitudCorporativa(Base):
    """Cada fila es un envío real del formulario 'Solicita una cotización'
    de la página pública /corporate (antes ese formulario no llamaba a
    ningún backend — ver Corporate.tsx, `<form>` sin onSubmit). Todavía no
    es un CRM con múltiples contactos por empresa a través del tiempo: si
    más adelante hace falta agrupar varias solicitudes de la misma empresa,
    se puede separar en una tabla Empresa aparte con una migración nueva."""

    __tablename__ = "solicitudes_corporativas"

    id_solicitud = Column(Integer, primary_key=True, index=True)
    nombre_empresa = Column(String(150), nullable=False)
    numero_empleados = Column(String(20), nullable=True)
    nombre_contacto = Column(String(100), nullable=False)
    email_corporativo = Column(String(150), nullable=False)
    telefono = Column(String(30), nullable=False)
    mensaje = Column(Text, nullable=True)
    estado = Column(
        String(20),
        CheckConstraint("estado IN ('nuevo', 'contactado', 'cerrado', 'descartado')"),
        nullable=False,
        default="nuevo",
    )
    fecha_creacion = Column(TIMESTAMP, server_default=func.now())
