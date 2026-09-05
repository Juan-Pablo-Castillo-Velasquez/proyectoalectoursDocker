import re
from datetime import datetime

from pydantic import BaseModel, field_validator

_HEX_RE = re.compile(r"^#[0-9a-fA-F]{6}$")


def _validar_hex(valor: str) -> str:
    if not _HEX_RE.match(valor):
        raise ValueError("Color inválido: debe ser un hex de 6 dígitos, ej. #6e1832")
    return valor.lower()


class TemaBase(BaseModel):
    nombre: str
    color_primario_claro: str
    color_primario_oscuro: str
    color_secundario_claro: str
    color_secundario_oscuro: str

    @field_validator(
        "color_primario_claro", "color_primario_oscuro",
        "color_secundario_claro", "color_secundario_oscuro",
    )
    @classmethod
    def _colores_hex(cls, v: str) -> str:
        return _validar_hex(v)


class TemaCreate(TemaBase):
    pass


class TemaUpdate(TemaBase):
    pass


class TemaResponse(TemaBase):
    id_tema: int
    clave: str
    activo: bool
    es_predeterminado: bool
    fecha_creacion: datetime | None = None

    class Config:
        from_attributes = True
