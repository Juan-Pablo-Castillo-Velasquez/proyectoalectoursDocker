"""reemplazar fotos de Unsplash por las reales de Cloudinary

Revision ID: 6d40c7dfb3d0
Revises: 7972baf77f44
Create Date: 2026-09-03 01:12:21.277354

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '6d40c7dfb3d0'
down_revision: Union[str, None] = '7972baf77f44'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Generado por subir_imagenes_hoteles_cloudinary.py: estas son las URLs
# reales que Cloudinary devolvió al subir cada foto demo (antes apuntaban
# directo a Unsplash). La condición del UPDATE de abajo
# solo pisa NULL o una URL todavía de Unsplash -- nunca una foto que un
# admin ya haya subido de verdad después (ver POST /api/hoteles/{id}/imagen).
FOTOS_CLOUDINARY = {
    'Hotel Paraiso': 'https://res.cloudinary.com/urvnvwir/image/upload/v1788396744/alectours/hoteles/hotel-paraiso.jpg',
    'Resort Sol y Arena': 'https://res.cloudinary.com/urvnvwir/image/upload/v1788397931/alectours/hoteles/resort-sol-y-arena.jpg',
    'Montana Magica': 'https://res.cloudinary.com/urvnvwir/image/upload/v1788397931/alectours/hoteles/montana-magica.jpg',
    'Gran Hotel Centro': 'https://res.cloudinary.com/urvnvwir/image/upload/v1788396745/alectours/hoteles/gran-hotel-centro.jpg',
    'Cabanas del Bosque': 'https://res.cloudinary.com/urvnvwir/image/upload/v1788397933/alectours/hoteles/cabanas-del-bosque.jpg',
    'Plaza Mayor Hotel': 'https://res.cloudinary.com/urvnvwir/image/upload/v1788397935/alectours/hoteles/plaza-mayor-hotel.jpg',
    'Boutique Santa Marta': 'https://res.cloudinary.com/urvnvwir/image/upload/v1788397937/alectours/hoteles/boutique-santa-marta.jpg',
    'EcoLodge Tayrona': 'https://res.cloudinary.com/urvnvwir/image/upload/v1788397938/alectours/hoteles/ecolodge-tayrona.jpg',
    'Hotel Imperial': 'https://res.cloudinary.com/urvnvwir/image/upload/v1788396748/alectours/hoteles/hotel-imperial.jpg',
    'Cali Pachanguero H.': 'https://res.cloudinary.com/urvnvwir/image/upload/v1788397940/alectours/hoteles/cali-pachanguero-h.jpg',
}

_UPDATE_SQL = sa.text(
    "UPDATE hoteles SET imagen_url = :url WHERE nombre_hotel = :nombre "
    "AND (imagen_url IS NULL OR imagen_url LIKE :unsplash_like)"
)


def upgrade() -> None:
    conn = op.get_bind()
    for nombre, url in FOTOS_CLOUDINARY.items():
        conn.execute(
            _UPDATE_SQL,
            {"url": url, "nombre": nombre, "unsplash_like": "%unsplash.com%"},
        )


def downgrade() -> None:
    # No revierte a las URLs de Unsplash: una vez que la cuenta de
    # Cloudinary tiene la imagen real, no tiene sentido volver atrás.
    pass
