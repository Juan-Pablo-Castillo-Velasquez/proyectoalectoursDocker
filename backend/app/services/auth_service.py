# services/auth_service.py

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.security import (
    create_access_token,
    create_verification_token,
    generate_token_pair,
    hash_password,
    verify_password,
    verify_verification_token,
)
from app.repositories.user_repository import create_user, get_user_by_email, get_user_by_username


def register_user(db: Session, username: str, email: str, password: str):
    existing_user = get_user_by_username(db, username)
    if existing_user:
        return {"error": "El nombre de usuario ya existe"}

    from app.models.user_model import Usuario

    existing_email = db.query(Usuario).filter(Usuario.correo_electronico == email).first()
    if existing_email:
        return {"error": "El correo electrónico ya está registrado"}

    hashed_password = hash_password(password)
    user_data = {
        "username": username,
        "correo_electronico": email,
        "password_hash": hashed_password,
        "activo": True,
        "verificado": False,
    }
    user = create_user(db, user_data)
    verification_token = create_verification_token(email)

    db.execute(text("INSERT INTO usuarios_roles (id_usuario, id_rol) VALUES (:uid, 2)"), {"uid": user.id_usuario})
    db.commit()

    # El frontend (Register.tsx / RegisterModal.tsx) crea y vincula el perfil
    # de cliente en la MISMA operación, justo después del registro. Esos
    # endpoints exigen sesión (Authorization: Bearer), así que este registro
    # debe devolver un access_token — auto-login del usuario recién creado —
    # para que el flujo no falle con 401. El rol por defecto es "cliente"
    # (id_rol 2). Un access token expira en minutos, de modo que no deja la
    # cuenta abierta indefinidamente; la verificación de email sigue aparte.
    access_token = create_access_token(data={"sub": str(user.id_usuario), "roles": ["cliente"]})

    return {
        "user_id": user.id_usuario,
        "access_token": access_token,
        "token_type": "bearer",
        "verification_token": verification_token,
        "email": email,
    }


def login_user(db: Session, correo_electronico: str, password: str):
    """
    Autentica un usuario por su correo electrónico (único método de login
    soportado: nunca por username) y retorna tokens JWT + datos del usuario.
    """
    user = get_user_by_email(db, correo_electronico)
    if not user:
        return None

    if not verify_password(password, user.password_hash):
        return None

    if not user.verificado:
        return {"error": "Por favor verifica tu email antes de continuar"}

    # Antes no se revisaba: un admin podía "desactivar" un usuario
    # (activo=False, ver PUT /api/usuarios/{id}) y ese usuario podía seguir
    # iniciando sesión con normalidad, porque login_user solo validaba
    # contraseña y verificado. La desactivación quedaba sin efecto real.
    if not user.activo:
        return {"error": "Esta cuenta está desactivada. Contacta al administrador."}

    # Obtener roles con SQL directo (sin modelos ORM para roles/usuarios_roles)
    rows = db.execute(
        text("""
            SELECT r.nombre_rol
            FROM roles r
            JOIN usuarios_roles ur ON r.id_rol = ur.id_rol
            WHERE ur.id_usuario = :uid
        """),
        {"uid": user.id_usuario},
    ).fetchall()
    roles = [r.nombre_rol for r in rows]

    tokens = generate_token_pair(user.id_usuario, roles=roles)
    tokens.update(
        {
            "user_id": user.id_usuario,
            "username": user.username,
            "id_cliente": user.id_cliente,
            "roles": roles,
            "foto_perfil": user.foto_perfil,
        }
    )
    return tokens


def verify_user_email(db: Session, token: str):
    from app.models.user_model import Usuario

    email = verify_verification_token(token)
    if not email:
        return {"error": "Token inválido o expirado"}

    user = db.query(Usuario).filter(Usuario.correo_electronico == email).first()
    if not user:
        return {"error": "Usuario no encontrado"}

    if user.verificado:
        return {"message": "El email ya estaba verificado"}

    user.verificado = True
    db.commit()

    return {
        "message": "Email verificado exitosamente",
        "email": email,
        "user_id": user.id_usuario,
    }
