from pydantic import BaseModel, EmailStr, Field


class UsuarioAdminResponse(BaseModel):
    id_usuario: int
    username: str
    correo_electronico: str
    activo: bool
    verificado: bool
    nombre_completo: str | None = None
    roles: list[str] = []
    foto_perfil: str | None = None

    class Config:
        from_attributes = True


class UsuarioAdminCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    correo_electronico: EmailStr
    password: str = Field(..., min_length=8)
    roles: list[str] = []


class UsuarioAdminUpdate(BaseModel):
    activo: bool | None = None
    verificado: bool | None = None
    roles: list[str] | None = None


class RolResponse(BaseModel):
    id_rol: int
    nombre_rol: str

    class Config:
        from_attributes = True
