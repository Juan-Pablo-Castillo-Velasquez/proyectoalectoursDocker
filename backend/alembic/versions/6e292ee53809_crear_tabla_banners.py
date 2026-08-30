"""crear tabla banners_publicitarios

Revision ID: 6e292ee53809
Revises: c8810ca8bd10
Create Date: 2026-08-29 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '6e292ee53809'
down_revision: Union[str, None] = 'c8810ca8bd10'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Sección 7 del plan de mejora: banners publicitarios administrables
    # (carrusel del home / oferta destacada). Tabla nueva desde cero — no
    # existía ninguna con este propósito (/api/promociones/* deriva datos
    # de `hoteles`, no es esto).
    op.create_table(
        'banners_publicitarios',
        sa.Column('id_banner', sa.Integer(), nullable=False),
        sa.Column('titulo', sa.String(length=150), nullable=False),
        sa.Column('descripcion_corta', sa.String(length=300), nullable=True),
        sa.Column('imagen_url', sa.String(length=255), nullable=False),
        sa.Column('texto_boton', sa.String(length=50), nullable=True),
        sa.Column('link_destino', sa.String(length=255), nullable=True),
        sa.Column('fecha_inicio', sa.Date(), nullable=True),
        sa.Column('fecha_fin', sa.Date(), nullable=True),
        sa.Column('orden', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('activo', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('fecha_creacion', sa.TIMESTAMP(), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id_banner'),
    )
    op.create_index(op.f('ix_banners_publicitarios_id_banner'), 'banners_publicitarios', ['id_banner'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_banners_publicitarios_id_banner'), table_name='banners_publicitarios')
    op.drop_table('banners_publicitarios')
