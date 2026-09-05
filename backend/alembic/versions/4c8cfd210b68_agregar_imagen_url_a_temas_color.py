"""agregar imagen_url a temas_color

Revision ID: 4c8cfd210b68
Revises: 5680ccc5f729
Create Date: 2026-09-05 05:15:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '4c8cfd210b68'
down_revision: Union[str, None] = '5680ccc5f729'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('temas_color', sa.Column('imagen_url', sa.String(length=500), nullable=True))


def downgrade() -> None:
    op.drop_column('temas_color', 'imagen_url')
