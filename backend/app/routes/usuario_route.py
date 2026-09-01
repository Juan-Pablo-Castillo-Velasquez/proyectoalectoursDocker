import contextlib
import os
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.cache import delete_pattern
from app.core.database import get_db
from app.core.deps import get_current_usuario
from app.core.file_validation import validar_y_leer_archivo
from app.core.security import hash_password, require_admin, verify_password
from app.models.auth_model import Rol, UsuarioRol
from app.models.user_model import Usuario
from app.schemas.user_schema import UsuarioResponse
from app.schemas.usuario_admin_schema import (
    RolResponse,
    UsuarioAdminCreate,
    UsuarioAdminResponse,
    UsuarioAdminUpdate,
)

router = APIRouter(prefix="/api/usuarios", tags=["Usuarios"])
roles_router = APIRouter(prefix="/api/roles", tags=["Roles"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static", "uploads", "perfiles")
PUBLIC_PATH_PREFIX = "/uploads/perfiles"
PERFILES_TIPOS_PERMITIDOS = {"image/jpeg", "image/jpg", "image/png", "image/webp"}
TAMANO_MAXIMO_BYTES = 5 * 1024 * 1024  # 5MB


def _shape_usuario_admin(db: Session, usuario: Usuario) -> UsuarioAdminResponse:
    roles = [
        r.nombre_rol
        for r in db.query(Rol)
        .join(UsuarioRol, UsuarioRol.id_rol == Rol.id_rol)
        .filter(UsuarioRol.id_usuario == usuario.id_usuario)
        .all()
    ]
    nombre_completo = None
    if usuario.cliente:
        nombre_completo = f"{usuario.cliente.nombre} {usuario.cliente.apellido}"
    elif usuario.empleado:
        nombre_completo = f"{usuario.empleado.nombre} {usuario.empleado.apellido}"

    return UsuarioAdminResponse(
        id_usuario=usuario.id_usuario,
        username=usuario.username,
        correo_electronico=usuario.correo_electronico,
        # `activo`/`verificado` son NULLABLE en la BD (columnas creadas sin
        # default a nivel de motor) — cuentas antiguas pueden tener NULL,
        # que tratamos como su valor por defecto real (activa / no verificada).
        activo=usuario.activo if usuario.activo is not None else True,
        verificado=bool(usuario.verificado),
        nombre_completo=nombre_completo,
        roles=roles,
        foto_perfil=usuario.foto_perfil,
    )


@router.get("", response_model=list[UsuarioAdminResponse])
def admin_get_usuarios(db: Session = Depends(get_db), _admin: int = Depends(require_admin)):
    usuarios = db.query(Usuario).order_by(Usuario.id_usuario.asc()).all()
    return [_shape_usuario_admin(db, u) for u in usuarios]


@router.post("", response_model=UsuarioAdminResponse, status_code=201)
def admin_create_usuario(data: UsuarioAdminCreate, db: Session = Depends(get_db), _admin: int = Depends(require_admin)):
    if db.query(Usuario).filter(Usuario.username == data.username).first():
        raise HTTPException(status_code=400, detail="El nombre de usuario ya existe")
    if db.query(Usuario).filter(Usuario.correo_electronico == data.correo_electronico).first():
        raise HTTPException(status_code=400, detail="El correo electrónico ya está registrado")

    roles_validos = (
        {r.nombre_rol: r.id_rol for r in db.query(Rol).filter(Rol.nombre_rol.in_(data.roles)).all()}
        if data.roles
        else {}
    )
    faltantes = set(data.roles) - set(roles_validos.keys())
    if faltantes:
        raise HTTPException(status_code=400, detail=f"Rol(es) inexistente(s): {', '.join(faltantes)}")

    usuario = Usuario(
        username=data.username,
        correo_electronico=data.correo_electronico,
        password_hash=hash_password(data.password),
        activo=True,
        verificado=True,
    )
    db.add(usuario)
    db.flush()

    for id_rol in roles_validos.values():
        db.add(UsuarioRol(id_usuario=usuario.id_usuario, id_rol=id_rol))

    db.commit()
    db.refresh(usuario)
    return _shape_usuario_admin(db, usuario)


@router.put("/{usuario_id}", response_model=UsuarioAdminResponse)
def admin_update_usuario(
    usuario_id: int,
    data: UsuarioAdminUpdate,
    db: Session = Depends(get_db),
    _admin: int = Depends(require_admin),
):
    usuario = db.query(Usuario).filter(Usuario.id_usuario == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    if data.activo is not None:
        usuario.activo = data.activo
    if data.verificado is not None:
        usuario.verificado = data.verificado

    if data.roles is not None:
        roles_validos = (
            {r.nombre_rol: r.id_rol for r in db.query(Rol).filter(Rol.nombre_rol.in_(data.roles)).all()}
            if data.roles
            else {}
        )
        faltantes = set(data.roles) - set(roles_validos.keys())
        if faltantes:
            raise HTTPException(status_code=400, detail=f"Rol(es) inexistente(s): {', '.join(faltantes)}")

        db.query(UsuarioRol).filter(UsuarioRol.id_usuario == usuario_id).delete()
        for id_rol in roles_validos.values():
            db.add(UsuarioRol(id_usuario=usuario_id, id_rol=id_rol))

    db.commit()
    db.refresh(usuario)
    return _shape_usuario_admin(db, usuario)


@router.delete("/{usuario_id}")
def admin_delete_usuario(usuario_id: int, db: Session = Depends(get_db), _admin: int = Depends(require_admin)):
    usuario = db.query(Usuario).filter(Usuario.id_usuario == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    db.delete(usuario)
    db.commit()
    return {"message": "Usuario eliminado exitosamente"}


@roles_router.get("", response_model=list[RolResponse])
def get_roles(db: Session = Depends(get_db), _admin: int = Depends(require_admin)):
    return db.query(Rol).order_by(Rol.nombre_rol.asc()).all()


def _borrar_archivo_si_existe(foto_perfil: str | None) -> None:
    if not foto_perfil:
        return
    filename = os.path.basename(foto_perfil)
    ruta = os.path.join(UPLOAD_DIR, filename)
    if os.path.isfile(ruta):
        with contextlib.suppress(OSError):
            os.remove(ruta)


@router.get("/me", response_model=UsuarioResponse)
def get_me(usuario: Usuario = Depends(get_current_usuario)):
    return usuario


class CambiarPasswordRequest(BaseModel):
    contrasena_actual: str
    nueva_contrasena: str


@router.put("/me/password")
def cambiar_password_propio(
    data: CambiarPasswordRequest,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_usuario),
):
    """Cambio de contraseña de la cuenta ya autenticada (por token), no de
    un cliente específico como /clientes/{id}/cambiar-contrasena (que exige
    un id_cliente y por tanto no sirve para una cuenta de administrador sin
    cliente vinculado) ni del flujo de 'olvidé mi contraseña' (token de un
    solo uso por correo, ver password_reset). Sirve para cualquier Usuario:
    admin, empleado o cliente."""
    if not verify_password(data.contrasena_actual, usuario.password_hash):
        raise HTTPException(status_code=400, detail="La contraseña actual es incorrecta")

    if len(data.nueva_contrasena) < 8:
        raise HTTPException(status_code=400, detail="La nueva contraseña debe tener al menos 8 caracteres")

    usuario.password_hash = hash_password(data.nueva_contrasena)
    db.commit()
    return {"message": "Contraseña actualizada correctamente"}


@router.post("/me/foto", response_model=UsuarioResponse)
async def subir_foto_perfil(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_usuario),
):
    if file.content_type not in PERFILES_TIPOS_PERMITIDOS:
        raise HTTPException(
            status_code=422,
            detail="Formato de imagen no soportado. Usa JPG, PNG o WEBP.",
        )

    contenido, extension = validar_y_leer_archivo(
        file,
        tipos_permitidos=PERFILES_TIPOS_PERMITIDOS,
        mensaje_tipo="Formato de imagen no soportado. Usa JPG, PNG o WEBP.",
        tamano_maximo_bytes=TAMANO_MAXIMO_BYTES,
    )

    os.makedirs(UPLOAD_DIR, exist_ok=True)

    nombre_archivo = f"{uuid.uuid4().hex}.{extension}"
    ruta_destino = os.path.join(UPLOAD_DIR, nombre_archivo)
    with open(ruta_destino, "wb") as f:
        f.write(contenido)

    _borrar_archivo_si_existe(usuario.foto_perfil)

    usuario.foto_perfil = f"{PUBLIC_PATH_PREFIX}/{nombre_archivo}"
    db.commit()
    db.refresh(usuario)
    _invalidar_cache_foto(usuario)
    return usuario


@router.delete("/me/foto", response_model=UsuarioResponse)
def eliminar_foto_perfil(db: Session = Depends(get_db), usuario: Usuario = Depends(get_current_usuario)):
    _borrar_archivo_si_existe(usuario.foto_perfil)
    usuario.foto_perfil = None
    db.commit()
    db.refresh(usuario)
    _invalidar_cache_foto(usuario)
    return usuario


def _invalidar_cache_foto(usuario: Usuario) -> None:
    """Usuario.foto_perfil se expone también en ClienteResponse/EmpleadoResponse
    (ver Cliente.foto_perfil / Empleado.foto_perfil) — al subir o borrar la
    foto hay que invalidar el listado del que sea dueño de la cuenta, si no
    el panel de admin seguiría mostrando la foto vieja hasta que expire el TTL."""
    if usuario.id_cliente:
        delete_pattern("clientes:list:*")
    if usuario.id_empleado:
        delete_pattern("empleados:list:*")
