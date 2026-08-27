from pydantic import BaseModel, Field, field_validator, EmailStr
from typing import Optional
from datetime import date


class ClienteCreate(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=100)
    apellido: str = Field(..., min_length=1, max_length=100)
    cedula: str = Field(..., min_length=1, max_length=20)
    correo: Optional[EmailStr] = None
    celular: Optional[str] = Field(None, max_length=20)
    direccion: Optional[str] = Field(None, max_length=255)
    ciudad: Optional[str] = Field(None, max_length=100)
    pais: Optional[str] = Field(None, max_length=100)
    fecha_nacimiento: Optional[date] = None


class ClienteUpdate(BaseModel):
    nombre: Optional[str] = None
    apellido: Optional[str] = None
    correo: Optional[EmailStr] = None
    celular: Optional[str] = None
    direccion: Optional[str] = None
    ciudad: Optional[str] = None
    pais: Optional[str] = None
    fecha_nacimiento: Optional[date] = None


class ClienteResponse(BaseModel):
    id_cliente: int
    nombre: str
    apellido: str
    cedula: str
    correo: Optional[str]
    celular: Optional[str]
    direccion: Optional[str]
    ciudad: Optional[str]
    pais: Optional[str]
    fecha_nacimiento: Optional[date]
    # Ruta relativa real (ej. "/uploads/perfiles/xxx.jpg") tomada de la
    # cuenta de Usuario vinculada — ver Cliente.foto_perfil. None si el
    # cliente no tiene cuenta o no ha subido foto; nunca se inventa.
    foto_perfil: Optional[str] = None

    class Config:
        from_attributes = True


class EmpleadoCreate(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=100)
    apellido: str = Field(..., min_length=1, max_length=100)
    cedula: str = Field(..., min_length=1, max_length=20)
    correo_electronico: Optional[EmailStr] = None
    celular: Optional[str] = Field(None, max_length=20)
    direccion: Optional[str] = Field(None, max_length=255)
    ciudad: Optional[str] = Field(None, max_length=100)
    pais: Optional[str] = Field(None, max_length=100)
    fecha_nacimiento: Optional[date] = None
    fecha_contratacion: date


class EmpleadoUpdate(BaseModel):
    nombre: Optional[str] = None
    apellido: Optional[str] = None
    correo_electronico: Optional[EmailStr] = None
    celular: Optional[str] = None
    direccion: Optional[str] = None
    ciudad: Optional[str] = None
    pais: Optional[str] = None
    fecha_nacimiento: Optional[date] = None
    activo: Optional[bool] = None


class EmpleadoResponse(BaseModel):
    id_empleado: int
    nombre: str
    apellido: str
    cedula: str
    correo_electronico: Optional[str]
    celular: Optional[str]
    direccion: Optional[str]
    ciudad: Optional[str]
    pais: Optional[str]
    fecha_nacimiento: Optional[date]
    fecha_contratacion: date
    activo: bool
    # Ver Empleado.foto_perfil / ClienteResponse.foto_perfil — mismo criterio.
    foto_perfil: Optional[str] = None

    class Config:
        from_attributes = True
