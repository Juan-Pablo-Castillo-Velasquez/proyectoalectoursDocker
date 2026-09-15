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


class Permiso(Base):
    """
    Catálogo fijo de permisos que el backend realmente conoce y aplica (ver
    require_permission en app/core/deps.py). No es una tabla libre: cada
    `clave` de acá corresponde a una llamada real a
    require_permission("...") en algún endpoint -- crear una fila acá a
    mano sin ese chequeo en el código no habilita nada por sí sola. Se
    siembra por migración (ver 5d2370d4474f_crear_tablas_permisos.py); no
    hay endpoint para crear permisos nuevos desde el panel, solo para
    asignar/quitar los ya existentes a un rol.
    """

    __tablename__ = "permisos"

    id_permiso = Column(Integer, primary_key=True, index=True)
    clave = Column(String(80), unique=True, nullable=False)
    nombre = Column(String(120), nullable=False)
    categoria = Column(String(50), nullable=False)


class RolPermiso(Base):
    """
    Qué permisos tiene cada rol -- mismo patrón many-to-many que
    UsuarioRol. El rol 'admin' recibe TODOS los permisos existentes desde
    la propia migración que crea esta tabla, pero además require_permission
    siempre deja pasar a 'admin' sin siquiera consultar esta tabla (igual
    que require_admin ya hacía) -- así que esta tabla solo importa de
    verdad para los roles que no son 'admin'.
    """

    __tablename__ = "roles_permisos"

    id_rol = Column(Integer, ForeignKey("roles.id_rol", ondelete="CASCADE"), primary_key=True)
    id_permiso = Column(Integer, ForeignKey("permisos.id_permiso", ondelete="CASCADE"), primary_key=True)
