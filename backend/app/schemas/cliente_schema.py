from datetime import date, datetime

from pydantic import BaseModel, EmailStr, Field


class ClienteCreate(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=100)
    apellido: str = Field(..., min_length=1, max_length=100)
    cedula: str = Field(..., min_length=1, max_length=20)
    correo: EmailStr | None = None
    celular: str | None = Field(None, max_length=20)
    direccion: str | None = Field(None, max_length=255)
    ciudad: str | None = Field(None, max_length=100)
    pais: str | None = Field(None, max_length=100)
    fecha_nacimiento: date | None = None


class ClienteUpdate(BaseModel):
    nombre: str | None = None
    apellido: str | None = None
    correo: EmailStr | None = None
    celular: str | None = None
    direccion: str | None = None
    ciudad: str | None = None
    pais: str | None = None
    fecha_nacimiento: date | None = None


class ClienteResponse(BaseModel):
    id_cliente: int
    nombre: str
    apellido: str
    cedula: str
    correo: str | None
    celular: str | None
    direccion: str | None
    ciudad: str | None
    pais: str | None
    fecha_nacimiento: date | None
    # Ruta relativa real (ej. "/uploads/perfiles/xxx.jpg") tomada de la
    # cuenta de Usuario vinculada — ver Cliente.foto_perfil. None si el
    # cliente no tiene cuenta o no ha subido foto; nunca se inventa.
    foto_perfil: str | None = None
    # Ya existía en la tabla (Cliente.fecha_registro), solo faltaba
    # exponerse en la respuesta — para "cliente desde" en el perfil de
    # admin. No requiere ninguna migración.
    fecha_registro: datetime | None = None

    class Config:
        from_attributes = True


class EmpleadoCreate(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=100)
    apellido: str = Field(..., min_length=1, max_length=100)
    cedula: str = Field(..., min_length=1, max_length=20)
    correo_electronico: EmailStr | None = None
    celular: str | None = Field(None, max_length=20)
    direccion: str | None = Field(None, max_length=255)
    ciudad: str | None = Field(None, max_length=100)
    pais: str | None = Field(None, max_length=100)
    fecha_nacimiento: date | None = None
    fecha_contratacion: date


class EmpleadoUpdate(BaseModel):
    nombre: str | None = None
    apellido: str | None = None
    correo_electronico: EmailStr | None = None
    celular: str | None = None
    direccion: str | None = None
    ciudad: str | None = None
    pais: str | None = None
    fecha_nacimiento: date | None = None
    activo: bool | None = None


class EmpleadoResponse(BaseModel):
    id_empleado: int
    nombre: str
    apellido: str
    cedula: str
    correo_electronico: str | None
    celular: str | None
    direccion: str | None
    ciudad: str | None
    pais: str | None
    fecha_nacimiento: date | None
    fecha_contratacion: date
    activo: bool
    # Ver Empleado.foto_perfil / ClienteResponse.foto_perfil — mismo criterio.
    foto_perfil: str | None = None

    class Config:
        from_attributes = True
