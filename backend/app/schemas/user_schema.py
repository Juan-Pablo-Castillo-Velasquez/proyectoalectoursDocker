# schemas/user_schema.py


from pydantic import BaseModel, EmailStr


class UsuarioCreate(BaseModel):
    username: str
    correo_electronico: EmailStr
    password: str


class UsuarioLogin(BaseModel):
    # El login es siempre por correo electrónico (nunca por username) —
    # se llama `username` por compatibilidad con el frontend/OAuth2, pero
    # se valida y se usa como correo.
    username: EmailStr
    password: str


class UsuarioResponse(BaseModel):
    id_usuario: int
    username: str
    correo_electronico: str
    foto_perfil: str | None = None
    id_cliente: int | None = None
    id_empleado: int | None = None

    class Config:
        from_attributes = True


class PasswordResetRequest(BaseModel):
    correo_electronico: str


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str
