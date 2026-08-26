from sqlalchemy import Column, Integer, String, Boolean, TIMESTAMP, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Usuario(Base):
    __tablename__ = "usuarios"

    id_usuario = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    correo_electronico = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    id_cliente = Column(Integer, ForeignKey("clientes.id_cliente", ondelete="CASCADE"), unique=True)
    id_empleado = Column(Integer, ForeignKey("empleados.id_empleado", ondelete="CASCADE"), unique=True)
    activo = Column(Boolean, default=True)
    verificado = Column(Boolean, default=False)
    foto_perfil = Column(String(255), nullable=True)
    ultimo_login = Column(TIMESTAMP)
    fecha_creacion = Column(TIMESTAMP, server_default=func.now())

    cliente = relationship("Cliente", back_populates="usuario", uselist=False)
    empleado = relationship("Empleado", back_populates="usuario", uselist=False)