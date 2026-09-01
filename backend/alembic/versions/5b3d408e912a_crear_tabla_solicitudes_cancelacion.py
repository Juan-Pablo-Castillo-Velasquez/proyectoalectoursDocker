"""crear tabla solicitudes_cancelacion

Revision ID: 5b3d408e912a
Revises: 6e292ee53809
Create Date: 2026-08-31 22:56:12.899012

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '5b3d408e912a'
down_revision: Union[str, None] = '6e292ee53809'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'solicitudes_cancelacion',
        sa.Column('id_solicitud', sa.Integer(), primary_key=True, index=True),
        sa.Column(
            'id_reserva',
            sa.Integer(),
            sa.ForeignKey('reservas.id_reserva', ondelete='CASCADE'),
            nullable=False,
        ),
        sa.Column(
            'id_cliente',
            sa.Integer(),
            sa.ForeignKey('clientes.id_cliente', ondelete='CASCADE'),
            nullable=False,
        ),
        sa.Column('motivo', sa.String(length=100), nullable=False),
        sa.Column('motivo_detalle', sa.Text(), nullable=True),
        sa.Column('estado', sa.String(length=20), nullable=False, server_default='pendiente'),
        sa.Column('fecha_solicitud', sa.TIMESTAMP(), server_default=sa.text('now()')),
        sa.Column('fecha_resolucion', sa.TIMESTAMP(), nullable=True),
        sa.Column(
            'id_empleado_resolutor',
            sa.Integer(),
            sa.ForeignKey('empleados.id_empleado', ondelete='SET NULL'),
            nullable=True,
        ),
        sa.Column('comentario_resolucion', sa.Text(), nullable=True),
    )
    op.create_check_constraint(
        'ck_solicitudes_cancelacion_estado',
        'solicitudes_cancelacion',
        "estado IN ('pendiente', 'aprobada', 'rechazada')",
    )


def downgrade() -> None:
    op.drop_table('solicitudes_cancelacion')
