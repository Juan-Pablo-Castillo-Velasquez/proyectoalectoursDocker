"""agregar icono a temas_color

Revision ID: 5680ccc5f729
Revises: 6c564b92474a
Create Date: 2026-09-05 04:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '5680ccc5f729'
down_revision: Union[str, None] = '6c564b92474a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# Ícono decorativo (lucide-react) para cada uno de los 7 temas sembrados en
# 6c564b92474a -- catálogo cerrado, ver ICONOS_PERMITIDOS en
# app/schemas/tema_schema.py. Temas creados por el admin después de esta
# migración simplemente eligen el suyo desde el formulario.
ICONOS_POR_CLAVE = {
    "marca": "sparkles",
    "navidad": "tree-pine",
    "halloween": "ghost",
    "amor-amistad": "heart",
    "semana-santa": "flower2",
    "vacaciones-mitad-anio": "sun",
    "fin-de-anio": "party-popper",
}


def upgrade() -> None:
    op.add_column('temas_color', sa.Column('icono', sa.String(length=30), nullable=True))

    temas_table = sa.table(
        'temas_color',
        sa.column('clave', sa.String),
        sa.column('icono', sa.String),
    )
    for clave, icono in ICONOS_POR_CLAVE.items():
        op.execute(
            temas_table.update().where(temas_table.c.clave == clave).values(icono=icono)
        )


def downgrade() -> None:
    op.drop_column('temas_color', 'icono')
