"""crear tabla solicitudes_corporativas

Revision ID: f1b8d3a75c26
Revises: e7a2c9f04b18
Create Date: 2026-08-27 00:25:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'f1b8d3a75c26'
down_revision: Union[str, None] = 'e7a2c9f04b18'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'solicitudes_corporativas',
        sa.Column('id_solicitud', sa.Integer(), primary_key=True, index=True),
        sa.Column('nombre_empresa', sa.String(length=150), nullable=False),
        sa.Column('numero_empleados', sa.String(length=20), nullable=True),
        sa.Column('nombre_contacto', sa.String(length=100), nullable=False),
        sa.Column('email_corporativo', sa.String(length=150), nullable=False),
        sa.Column('telefono', sa.String(length=30), nullable=False),
        sa.Column('mensaje', sa.Text(), nullable=True),
        sa.Column('estado', sa.String(length=20), nullable=False, server_default='nuevo'),
        sa.Column('fecha_creacion', sa.TIMESTAMP(), server_default=sa.text('now()')),
    )
    op.create_check_constraint(
        'ck_solicitudes_corporativas_estado',
        'solicitudes_corporativas',
        "estado IN ('nuevo', 'contactado', 'cerrado', 'descartado')",
    )


def downgrade() -> None:
    op.drop_table('solicitudes_corporativas')
