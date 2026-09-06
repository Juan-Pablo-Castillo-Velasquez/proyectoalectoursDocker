"""agregar tipo a banners_publicitarios

Revision ID: efa1e108ca6b
Revises: 09c088ac3e2f
Create Date: 2026-09-06 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'efa1e108ca6b'
down_revision: Union[str, None] = '09c088ac3e2f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Discriminador de tipo de pieza dentro de la misma tabla de banners
    # ("banner" = carrusel/splash de siempre, "folleto" = pieza tipo
    # afiche con solo imagen + link, para la galeria nueva y separada de
    # Ofertas). server_default='banner' para que las filas ya existentes
    # sigan comportandose exactamente igual que antes de esta migracion.
    op.add_column(
        'banners_publicitarios',
        sa.Column('tipo', sa.String(length=20), nullable=False, server_default='banner'),
    )


def downgrade() -> None:
    op.drop_column('banners_publicitarios', 'tipo')
