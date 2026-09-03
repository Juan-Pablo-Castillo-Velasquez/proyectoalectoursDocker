"""agregar imagen_url a hoteles

Revision ID: ca501a57430f
Revises: b2f6a184e9d3
Create Date: 2026-09-03 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'ca501a57430f'
down_revision: Union[str, None] = 'b2f6a184e9d3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Hasta ahora Hotel no tenía NINGÚN campo de imagen: el frontend
    # mostraba la misma foto de stock (Unsplash, por ciudad) para todos los
    # hoteles de una misma ciudad (ver CITY_IMAGES en HotelCard.tsx /
    # HotelDetail.tsx). Nullable porque los hoteles ya existentes no tienen
    # foto todavía — el frontend sigue usando el respaldo por ciudad hasta
    # que un admin suba una real (ver POST /api/hoteles/{id}/imagen).
    op.add_column('hoteles', sa.Column('imagen_url', sa.String(length=255), nullable=True))


def downgrade() -> None:
    op.drop_column('hoteles', 'imagen_url')
