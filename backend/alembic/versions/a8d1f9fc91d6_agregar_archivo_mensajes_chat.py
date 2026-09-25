"""agregar archivo_url y archivo_nombre a mensajes_chat

Revision ID: a8d1f9fc91d6
Revises: 3d9469da2898
Create Date: 2026-09-25 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a8d1f9fc91d6'
down_revision: Union[str, None] = '3d9469da2898'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Adjunto que no es una imagen (por ahora, PDF real validado por bytes
    # de cabecera -- ver ARCHIVO_TIPOS_PERMITIDOS en mensaje_chat_route.py).
    # Separado de imagen_url a propósito: un mensaje nunca tiene ambos a la
    # vez, pero mantenerlos en columnas distintas evita que el frontend
    # tenga que adivinar el tipo real de imagen_url por su extensión --
    # sigue exactamente igual para imágenes (inline + lightbox) y una
    # tarjeta de documento descargable para archivo_url.
    op.add_column('mensajes_chat', sa.Column('archivo_url', sa.String(), nullable=True))
    # Nombre original del archivo (ej. "itinerario.pdf") -- guardar_imagen()
    # nombra el archivo en disco/Cloudinary con un uuid, así que sin esto
    # no habría ningún nombre real que mostrar en la tarjeta de descarga.
    op.add_column('mensajes_chat', sa.Column('archivo_nombre', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('mensajes_chat', 'archivo_nombre')
    op.drop_column('mensajes_chat', 'archivo_url')
