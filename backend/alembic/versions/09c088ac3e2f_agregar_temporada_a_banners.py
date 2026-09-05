"""agregar temporada a banners_publicitarios

Revision ID: 09c088ac3e2f
Revises: 43bcfdc6950d
Create Date: 2026-09-05 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '09c088ac3e2f'
down_revision: Union[str, None] = '43bcfdc6950d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Etiqueta de temporada opcional en cada banner (coincide con
    # Tema.clave, ej. "halloween") -- NULL = vigente todo el año. Permite
    # marcar un banner para que solo aparezca en el carrusel público
    # mientras esa temporada de color esté realmente activa (ver
    # BannerRepository.get_activos), en vez de mezclar contenido de
    # temporada con el resto o depender de activar/desactivarlo a mano.
    op.add_column('banners_publicitarios', sa.Column('temporada', sa.String(length=40), nullable=True))


def downgrade() -> None:
    op.drop_column('banners_publicitarios', 'temporada')
