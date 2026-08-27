"""crear tabla configuracion_sistema

Revision ID: d3f7b6c281a9
Revises: c8e2f5a91d47
Create Date: 2026-08-27 00:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'd3f7b6c281a9'
down_revision: Union[str, None] = 'c8e2f5a91d47'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'configuracion_sistema',
        sa.Column('id_config', sa.Integer(), primary_key=True, index=True),
        sa.Column('clave', sa.String(length=100), nullable=False, unique=True),
        sa.Column('valor', sa.Text(), nullable=True),
        sa.Column('descripcion', sa.String(length=255), nullable=True),
        sa.Column('actualizado_en', sa.TIMESTAMP(), server_default=sa.text('now()')),
    )


def downgrade() -> None:
    op.drop_table('configuracion_sistema')
