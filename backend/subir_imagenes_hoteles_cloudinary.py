#!/usr/bin/env python3
"""Sube a Cloudinary las 10 fotos demo de hoteles que hoy apuntan directo a
Unsplash (ver alembic/versions/6a87622a7a6e_poblar_imagen_url_hoteles_demo.py)
y deja el resultado en dos sitios:

1. La base de datos (hoteles.imagen_url) -- efecto inmediato, sin reiniciar
   nada.
2. Un nuevo archivo de migración de Alembic en alembic/versions/, para que
   una instalación nueva del proyecto (`docker compose up --build` desde
   cero) también termine con las URLs reales de Cloudinary en vez de las
   de Unsplash.

Por qué existe este script como paso manual en vez de hacerlo el asistente
directamente: ni el entorno donde corre el asistente ni la VM local del
puente a este computador tienen salida de red hacia Cloudinary/Unsplash
(bloqueado por política de red), pero ESTE contenedor sí -- ya se probó
subiendo una foto de perfil real con la misma cuenta. Además, Cloudinary
puede descargar la imagen de origen él mismo a partir de la URL (no hace
falta bajarla nosotros primero), así que este script solo necesita que el
contenedor del backend llegue a api.cloudinary.com, exactamente lo mismo
que ya funciona para las fotos de perfil.

Uso (con los contenedores ya levantados):
    docker compose exec backend python subir_imagenes_hoteles_cloudinary.py
"""

from __future__ import annotations

import secrets
import sys
from datetime import datetime, timezone
from pathlib import Path

import cloudinary.uploader

from app.core.database import SessionLocal
from app.core.image_storage import CLOUDINARY_CONFIGURADO
from app.models.hotel_model import Hotel

# Mismas URLs y mismo criterio que la migración de datos 6a87622a7a6e --
# se listan de nuevo aquí (en vez de importarlas desde un módulo de
# alembic, que no está pensado para importarse desde afuera) para que este
# script sea independiente y se pueda borrar sin afectar el historial de
# migraciones.
FOTOS_POR_HOTEL = {
    "Hotel Paraiso": "https://images.unsplash.com/photo-1605723517503-3cadb5818a0c?w=1200&q=80",
    "Resort Sol y Arena": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80",
    "Montana Magica": "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=1200&q=80",
    "Gran Hotel Centro": "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80",
    "Cabanas del Bosque": "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=1200&q=80",
    "Plaza Mayor Hotel": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80",
    "Boutique Santa Marta": "https://images.unsplash.com/photo-1596402184320-417e7178b2cd?w=1200&q=80",
    "EcoLodge Tayrona": "https://images.unsplash.com/photo-1542314831-c6a4d140f6c2?w=800&q=80",
    "Hotel Imperial": "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&q=80",
    "Cali Pachanguero H.": "https://images.unsplash.com/photo-1531761535209-180857e963b9?w=1200&q=80",
}


def _slug(nombre: str) -> str:
    """'Cali Pachanguero H.' -> 'cali-pachanguero-h' -- public_id legible
    en el Media Library en vez de un uuid, ya que estas fotos SÍ tienen un
    nombre de origen fijo (no son subidas de un usuario)."""
    limpio = "".join(c.lower() if c.isalnum() else "-" for c in nombre)
    while "--" in limpio:
        limpio = limpio.replace("--", "-")
    return limpio.strip("-")


def main() -> int:
    if not CLOUDINARY_CONFIGURADO:
        print(
            "CLOUDINARY_URL no está configurada en backend/.env -- no hay "
            "ninguna cuenta de Cloudinary a la cual subir estas imágenes. "
            "Nada que hacer.",
            file=sys.stderr,
        )
        return 1

    resultados: dict[str, str] = {}
    fallos: list[str] = []

    db = SessionLocal()
    try:
        for nombre, url_unsplash in FOTOS_POR_HOTEL.items():
            print(f"Subiendo: {nombre} ...", flush=True)
            try:
                resultado = cloudinary.uploader.upload(
                    url_unsplash,  # Cloudinary descarga la imagen de esta URL él mismo
                    folder="alectours/hoteles",
                    public_id=_slug(nombre),
                    resource_type="image",
                    overwrite=True,
                )
            except Exception as exc:  # noqa: BLE001 -- se reporta y se sigue con los demás
                print(f"  ERROR subiendo '{nombre}': {exc}", file=sys.stderr)
                fallos.append(nombre)
                continue

            url_cloudinary = resultado["secure_url"]
            resultados[nombre] = url_cloudinary
            print(f"  -> {url_cloudinary}")

            hotel = db.query(Hotel).filter(Hotel.nombre_hotel == nombre).first()
            if hotel is not None:
                hotel.imagen_url = url_cloudinary
            else:
                print(f"  (aviso: no hay ningún hotel llamado '{nombre}' en la base de datos)")

        db.commit()
    finally:
        db.close()

    if resultados:
        _escribir_migracion(resultados)

    print()
    if resultados:
        print(f"Listo: {len(resultados)}/{len(FOTOS_POR_HOTEL)} fotos subidas a Cloudinary.")
        print("La base de datos ya quedó actualizada (no hace falta reiniciar nada).")
        print(
            "También se creó una nueva migración de Alembic en alembic/versions/ "
            "para que una instalación nueva del proyecto también use estas URLs "
            "reales de Cloudinary desde el principio."
        )
    if fallos:
        print(f"No se pudieron subir {len(fallos)} foto(s): {', '.join(fallos)}", file=sys.stderr)
        return 1
    return 0


def _escribir_migracion(resultados: dict[str, str]) -> None:
    revision = secrets.token_hex(6)
    hoy = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S.%f")
    lineas_dict = "\n".join(f"    {nombre!r}: {url!r}," for nombre, url in resultados.items())
    contenido = f'''"""reemplazar fotos de Unsplash por las reales de Cloudinary

Revision ID: {revision}
Revises: 6a87622a7a6e
Create Date: {hoy}

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = {revision!r}
down_revision: Union[str, None] = '6a87622a7a6e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Generado por subir_imagenes_hoteles_cloudinary.py: estas son las URLs
# reales que Cloudinary devolvió al subir cada foto demo (antes apuntaban
# directo a Unsplash, ver 6a87622a7a6e). La condición del UPDATE de abajo
# solo pisa NULL o una URL todavía de Unsplash -- nunca una foto que un
# admin ya haya subido de verdad después (ver POST /api/hoteles/{{id}}/imagen).
FOTOS_CLOUDINARY = {{
{lineas_dict}
}}

_UPDATE_SQL = sa.text(
    "UPDATE hoteles SET imagen_url = :url WHERE nombre_hotel = :nombre "
    "AND (imagen_url IS NULL OR imagen_url LIKE :unsplash_like)"
)


def upgrade() -> None:
    conn = op.get_bind()
    for nombre, url in FOTOS_CLOUDINARY.items():
        conn.execute(
            _UPDATE_SQL,
            {{"url": url, "nombre": nombre, "unsplash_like": "%unsplash.com%"}},
        )


def downgrade() -> None:
    # No revierte a las URLs de Unsplash: una vez que la cuenta de
    # Cloudinary tiene la imagen real, no tiene sentido volver atrás.
    pass
'''
    destino = (
        Path(__file__).resolve().parent
        / "alembic"
        / "versions"
        / f"{revision}_reemplazar_fotos_hoteles_cloudinary.py"
    )
    destino.write_text(contenido, encoding="utf-8")
    print(f"Migración nueva escrita en: {destino}")


if __name__ == "__main__":
    raise SystemExit(main())
