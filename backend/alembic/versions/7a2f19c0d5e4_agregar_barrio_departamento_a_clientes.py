"""agregar barrio, departamento y codigo_postal a clientes

Revision ID: 7a2f19c0d5e4
Revises: 5d2370d4474f
Create Date: 2026-09-15 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '7a2f19c0d5e4'
down_revision = '5d2370d4474f'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Antes 'clientes' solo tenía direccion/ciudad/pais -- una dirección en
    # formato colombiano real ("Calle 45 #12-34") no incluye el barrio ni
    # el departamento, así que se agregan como columnas nuevas y separadas
    # (nullable: clientes ya existentes simplemente quedan sin ese dato,
    # nadie pierde su cuenta ni su historial por esta migración).
    op.add_column('clientes', sa.Column('barrio', sa.String(length=100), nullable=True))
    op.add_column('clientes', sa.Column('departamento', sa.String(length=100), nullable=True))
    op.add_column('clientes', sa.Column('codigo_postal', sa.String(length=10), nullable=True))


def downgrade() -> None:
    op.drop_column('clientes', 'codigo_postal')
    op.drop_column('clientes', 'departamento')
    op.drop_column('clientes', 'barrio')
