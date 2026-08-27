"""crear tabla notificaciones

Revision ID: e7a2c9f04b18
Revises: d3f7b6c281a9
Create Date: 2026-08-27 00:20:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'e7a2c9f04b18'
down_revision: Union[str, None] = 'd3f7b6c281a9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'notificaciones',
        sa.Column('id_notificacion', sa.Integer(), primary_key=True, index=True),
        sa.Column('tipo', sa.String(length=30), nullable=False),
        sa.Column('titulo', sa.String(length=200), nullable=False),
        sa.Column('mensaje', sa.Text(), nullable=True),
        sa.Column('id_referencia', sa.Integer(), nullable=True),
        sa.Column('leido', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('fecha_creacion', sa.TIMESTAMP(), server_default=sa.text('now()')),
    )
    op.create_index('ix_notificaciones_leido', 'notificaciones', ['leido'])


def downgrade() -> None:
    op.drop_index('ix_notificaciones_leido', table_name='notificaciones')
    op.drop_table('notificaciones')
