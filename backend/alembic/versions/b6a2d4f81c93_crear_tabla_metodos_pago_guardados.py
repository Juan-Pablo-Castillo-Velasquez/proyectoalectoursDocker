"""crear tabla metodos_pago_guardados

Revision ID: b6a2d4f81c93
Revises: e1f5a2c9d7b6
Create Date: 2026-08-26 20:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b6a2d4f81c93'
down_revision: Union[str, None] = 'e1f5a2c9d7b6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'metodos_pago_guardados',
        sa.Column('id_metodo_guardado', sa.Integer(), nullable=False),
        sa.Column('id_cliente', sa.Integer(), nullable=False),
        sa.Column('alias', sa.String(length=50), nullable=False),
        sa.Column('tipo', sa.String(length=30), nullable=False),
        sa.Column('ultimos4', sa.String(length=4), nullable=True),
        sa.Column('clave_hash', sa.String(length=255), nullable=False),
        sa.Column('predeterminado', sa.Boolean(), server_default=sa.text('false'), nullable=False),
        sa.Column('fecha_creacion', sa.TIMESTAMP(), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['id_cliente'], ['clientes.id_cliente'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id_metodo_guardado'),
    )
    op.create_index(op.f('ix_metodos_pago_guardados_id_metodo_guardado'), 'metodos_pago_guardados', ['id_metodo_guardado'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_metodos_pago_guardados_id_metodo_guardado'), table_name='metodos_pago_guardados')
    op.drop_table('metodos_pago_guardados')
