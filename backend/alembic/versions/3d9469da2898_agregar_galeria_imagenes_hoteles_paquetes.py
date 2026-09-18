"""agregar galeria de imagenes a hoteles y paquetes

Revision ID: 3d9469da2898
Revises: 389bd84211cf
Create Date: 2026-09-18 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '3d9469da2898'
down_revision: Union[str, None] = '389bd84211cf'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Portada de Paquete -- antes no existía NINGÚN campo de imagen propio
    # (ver Hotel.imagen_url, que sí existía desde antes). Mismo patrón:
    # nullable, paquetes existentes quedan sin portada hasta que un admin
    # suba una (ver POST /paquetes/{id}/imagen en reserva_route.py).
    op.add_column('paquetes', sa.Column('imagen_url', sa.String(length=255), nullable=True))

    # Galería de fotos reales por hotel (distinta de la portada) -- antes
    # la ficha pública rellenaba la galería con fotos de stock genéricas
    # (ver AMENITY_POOL en HotelDetail.tsx).
    op.create_table(
        'imagenes_hotel',
        sa.Column('id_imagen', sa.Integer(), nullable=False),
        sa.Column('id_hotel', sa.Integer(), nullable=False),
        sa.Column('url', sa.String(length=500), nullable=False),
        sa.Column('orden', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('fecha_creacion', sa.TIMESTAMP(), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['id_hotel'], ['hoteles.id_hotel'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id_imagen'),
    )
    op.create_index(op.f('ix_imagenes_hotel_id_imagen'), 'imagenes_hotel', ['id_imagen'], unique=False)
    op.create_index(op.f('ix_imagenes_hotel_id_hotel'), 'imagenes_hotel', ['id_hotel'], unique=False)

    # Mismo patrón para paquetes.
    op.create_table(
        'imagenes_paquete',
        sa.Column('id_imagen', sa.Integer(), nullable=False),
        sa.Column('id_paquete', sa.Integer(), nullable=False),
        sa.Column('url', sa.String(length=500), nullable=False),
        sa.Column('orden', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('fecha_creacion', sa.TIMESTAMP(), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['id_paquete'], ['paquetes.id_paquete'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id_imagen'),
    )
    op.create_index(op.f('ix_imagenes_paquete_id_imagen'), 'imagenes_paquete', ['id_imagen'], unique=False)
    op.create_index(op.f('ix_imagenes_paquete_id_paquete'), 'imagenes_paquete', ['id_paquete'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_imagenes_paquete_id_paquete'), table_name='imagenes_paquete')
    op.drop_index(op.f('ix_imagenes_paquete_id_imagen'), table_name='imagenes_paquete')
    op.drop_table('imagenes_paquete')

    op.drop_index(op.f('ix_imagenes_hotel_id_hotel'), table_name='imagenes_hotel')
    op.drop_index(op.f('ix_imagenes_hotel_id_imagen'), table_name='imagenes_hotel')
    op.drop_table('imagenes_hotel')

    op.drop_column('paquetes', 'imagen_url')
