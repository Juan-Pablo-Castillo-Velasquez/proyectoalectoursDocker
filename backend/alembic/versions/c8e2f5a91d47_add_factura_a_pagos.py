"""agregar numero_factura y comprobante_url a pagos

Revision ID: c8e2f5a91d47
Revises: b6a2d4f81c93
Create Date: 2026-08-27 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c8e2f5a91d47'
down_revision: Union[str, None] = 'b6a2d4f81c93'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('pagos', sa.Column('numero_factura', sa.String(length=20), nullable=True))
    op.add_column('pagos', sa.Column('comprobante_url', sa.String(length=255), nullable=True))
    op.create_unique_constraint('uq_pagos_numero_factura', 'pagos', ['numero_factura'])


def downgrade() -> None:
    op.drop_constraint('uq_pagos_numero_factura', 'pagos', type_='unique')
    op.drop_column('pagos', 'comprobante_url')
    op.drop_column('pagos', 'numero_factura')
