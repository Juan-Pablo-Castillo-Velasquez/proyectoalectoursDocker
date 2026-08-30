from sqlalchemy import TIMESTAMP, Boolean, Column, ForeignKey, Integer, String, Text
from sqlalchemy.sql import func

from app.core.database import Base


class Rol(Base):
    __tablename__ = "roles"

    id_rol = Column(Integer, primary_key=True, index=True)
    nombre_rol = Column(String(50), unique=True, nullable=False)


class UsuarioRol(Base):
    __tablename__ = "usuarios_roles"

    id_usuario = Column(Integer, ForeignKey("usuarios.id_usuario", ondelete="CASCADE"), primary_key=True)
    id_rol = Column(Integer, ForeignKey("roles.id_rol", ondelete="CASCADE"), primary_key=True)
    fecha_asignacion = Column(TIMESTAMP, server_default=func.now())


class SesionUsuario(Base):
    __tablename__ = "sesiones_usuario"

    id_sesion = Column(Integer, primary_key=True, index=True)
    id_usuario = Column(Integer, ForeignKey("usuarios.id_usuario", ondelete="CASCADE"), nullable=False)
    refresh_token = Column(Text, nullable=False)
    direccion_ip = Column(String(50))
    user_agent = Column(Text)
    fecha_creacion = Column(TIMESTAMP, server_default=func.now())
    fecha_expiracion = Column(TIMESTAMP)
    activa = Column(Boolean, default=True)


class RecuperacionPassword(Base):
    __tablename__ = "recuperacion_password"

    id_recuperacion = Column(Integer, primary_key=True, index=True)
    id_usuario = Column(Integer, ForeignKey("usuarios.id_usuario", ondelete="CASCADE"), nullable=False)
    token_recuperacion = Column(Text, nullable=False)
    usado = Column(Boolean, default=False)
    fecha_creacion = Column(TIMESTAMP, server_default=func.now())
    fecha_expiracion = Column(TIMESTAMP, nullable=False)
