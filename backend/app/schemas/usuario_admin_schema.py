from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List


class UsuarioAdminResponse(BaseModel):
    id_usuario: int
    username: str
    correo_electronico: str
    activo: bool
    verificado: bool
    nombre_completo: Optional[str] = None
    roles: List[str] = []
    foto_perfil: Optional[str] = None

    class Config:
        from_attributes = True


class UsuarioAdminCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    correo_electronico: EmailStr
    password: str = Field(..., min_length=8)
    roles: List[str] = []


class UsuarioAdminUpdate(BaseModel):
    activo: Optional[bool] = None
    verificado: Optional[bool] = None
    roles: Optional[List[str]] = None


class RolResponse(BaseModel):
    id_rol: int
    nombre_rol: str

    class Config:
        from_attributes = True
