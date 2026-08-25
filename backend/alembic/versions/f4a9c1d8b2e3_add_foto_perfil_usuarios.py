"""agregar foto_perfil a usuarios

Revision ID: f4a9c1d8b2e3
Revises: 83731da37b5e
Create Date: 2026-08-24 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f4a9c1d8b2e3'
down_revision: Union[str, None] = '83731da37b5e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('usuarios', sa.Column('foto_perfil', sa.String(length=255), nullable=True))


def downgrade() -> None:
    op.drop_column('usuarios', 'foto_perfil')
