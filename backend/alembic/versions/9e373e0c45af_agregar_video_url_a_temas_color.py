"""agregar video_url a temas_color

Revision ID: 9e373e0c45af
Revises: 4c8cfd210b68
Create Date: 2026-09-05 17:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '9e373e0c45af'
down_revision: Union[str, None] = '4c8cfd210b68'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('temas_color', sa.Column('video_url', sa.String(length=500), nullable=True))


def downgrade() -> None:
    op.drop_column('temas_color', 'video_url')
