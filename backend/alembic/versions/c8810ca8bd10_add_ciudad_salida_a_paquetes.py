"""agregar ciudad_salida a paquetes

Revision ID: c8810ca8bd10
Revises: f1b8d3a75c26
Create Date: 2026-08-29 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'c8810ca8bd10'
down_revision: Union[str, None] = 'f1b8d3a75c26'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Antes un Paquete solo tenía su ciudad de DESTINO implícita (vía los
    # hoteles reales vinculados en paquete_hotel). No existía ninguna forma
    # de registrar desde dónde sale el viaje (vuelo/transporte incluido),
    # así que no había manera de avisarle al admin que un paquete armado
    # para salir de Bogotá no le sirve tal cual a un cliente de Barranquilla.
    op.add_column('paquetes', sa.Column('ciudad_salida', sa.String(length=100), nullable=True))


def downgrade() -> None:
    op.drop_column('paquetes', 'ciudad_salida')
