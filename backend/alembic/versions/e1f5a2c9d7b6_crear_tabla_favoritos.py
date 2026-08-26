"""crear tabla favoritos

Revision ID: e1f5a2c9d7b6
Revises: d4c8a1f39b02
Create Date: 2026-08-26 15:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e1f5a2c9d7b6'
down_revision: Union[str, None] = 'd4c8a1f39b02'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'favoritos',
        sa.Column('id_favorito', sa.Integer(), nullable=False),
        sa.Column('id_cliente', sa.Integer(), nullable=False),
        sa.Column('id_hotel', sa.Integer(), nullable=False),
        sa.Column('fecha_creacion', sa.TIMESTAMP(), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['id_cliente'], ['clientes.id_cliente'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['id_hotel'], ['hoteles.id_hotel'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id_favorito'),
        sa.UniqueConstraint('id_cliente', 'id_hotel', name='uq_favoritos_cliente_hotel'),
    )
    op.create_index(op.f('ix_favoritos_id_favorito'), 'favoritos', ['id_favorito'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_favoritos_id_favorito'), table_name='favoritos')
    op.drop_table('favoritos')
