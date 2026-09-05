"""crear tabla temas_color

Revision ID: 6c564b92474a
Revises: 4f7efe4c291c
Create Date: 2026-09-05 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '6c564b92474a'
down_revision: Union[str, None] = '4f7efe4c291c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# Colores verificados con la formula de luminancia relativa de WCAG 2.1 AA
# (>=4.5:1): "claro"/"oscuro" en cada tema vs texto blanco (primario) o
# vs texto oscuro fijo #1f1a12 (secundario) -- ver app/models/tema_model.py.
TEMAS_INICIALES = [
    {
        "nombre": "Marca / Todo el año",
        "clave": "marca",
        "color_primario_claro": "#6e1832",
        "color_primario_oscuro": "#c24d6e",
        "color_secundario_claro": "#b8912e",
        "color_secundario_oscuro": "#e8c77a",
        "activo": True,
        "es_predeterminado": True,
    },
    {
        "nombre": "Navidad",
        "clave": "navidad",
        "color_primario_claro": "#8c1c26",
        "color_primario_oscuro": "#cb4650",
        "color_secundario_claro": "#c79a3d",
        "color_secundario_oscuro": "#eccd82",
        "activo": False,
        "es_predeterminado": False,
    },
    {
        "nombre": "Halloween",
        "clave": "halloween",
        "color_primario_claro": "#4b2170",
        "color_primario_oscuro": "#8a5cc4",
        "color_secundario_claro": "#c97a2b",
        "color_secundario_oscuro": "#e8a75c",
        "activo": False,
        "es_predeterminado": False,
    },
    {
        "nombre": "Amor y Amistad",
        "clave": "amor-amistad",
        "color_primario_claro": "#8c2f52",
        "color_primario_oscuro": "#c04a7d",
        "color_secundario_claro": "#c9a06a",
        "color_secundario_oscuro": "#e8c9a0",
        "activo": False,
        "es_predeterminado": False,
    },
    {
        "nombre": "Semana Santa",
        "clave": "semana-santa",
        "color_primario_claro": "#4b1d5e",
        "color_primario_oscuro": "#8a5cae",
        "color_secundario_claro": "#b8a878",
        "color_secundario_oscuro": "#ded0a0",
        "activo": False,
        "es_predeterminado": False,
    },
    {
        "nombre": "Vacaciones de mitad de año",
        "clave": "vacaciones-mitad-anio",
        "color_primario_claro": "#0d5c73",
        "color_primario_oscuro": "#397d91",
        "color_secundario_claro": "#c9a24d",
        "color_secundario_oscuro": "#e0b96a",
        "activo": False,
        "es_predeterminado": False,
    },
    {
        "nombre": "Fin de año",
        "clave": "fin-de-anio",
        "color_primario_claro": "#16213e",
        "color_primario_oscuro": "#5c6e9e",
        "color_secundario_claro": "#d4af37",
        "color_secundario_oscuro": "#e8dcae",
        "activo": False,
        "es_predeterminado": False,
    },
]


def upgrade() -> None:
    op.create_table(
        'temas_color',
        sa.Column('id_tema', sa.Integer(), nullable=False),
        sa.Column('nombre', sa.String(length=60), nullable=False),
        sa.Column('clave', sa.String(length=40), nullable=False),
        sa.Column('color_primario_claro', sa.String(length=7), nullable=False),
        sa.Column('color_primario_oscuro', sa.String(length=7), nullable=False),
        sa.Column('color_secundario_claro', sa.String(length=7), nullable=False),
        sa.Column('color_secundario_oscuro', sa.String(length=7), nullable=False),
        sa.Column('activo', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('es_predeterminado', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('fecha_creacion', sa.TIMESTAMP(), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id_tema'),
    )
    op.create_index(op.f('ix_temas_color_id_tema'), 'temas_color', ['id_tema'], unique=False)
    op.create_index(op.f('ix_temas_color_clave'), 'temas_color', ['clave'], unique=True)

    temas_table = sa.table(
        'temas_color',
        sa.column('nombre', sa.String),
        sa.column('clave', sa.String),
        sa.column('color_primario_claro', sa.String),
        sa.column('color_primario_oscuro', sa.String),
        sa.column('color_secundario_claro', sa.String),
        sa.column('color_secundario_oscuro', sa.String),
        sa.column('activo', sa.Boolean),
        sa.column('es_predeterminado', sa.Boolean),
    )
    op.bulk_insert(temas_table, TEMAS_INICIALES)


def downgrade() -> None:
    op.drop_index(op.f('ix_temas_color_clave'), table_name='temas_color')
    op.drop_index(op.f('ix_temas_color_id_tema'), table_name='temas_color')
    op.drop_table('temas_color')
