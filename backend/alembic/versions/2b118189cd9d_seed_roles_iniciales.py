"""seed roles iniciales

Revision ID: 2b118189cd9d
Revises: 49b74c185f93
Create Date: 2026-08-16

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '2b118189cd9d'
down_revision: Union[str, None] = '49b74c185f93'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

roles_table = sa.table(
    'roles',
    sa.column('id_rol', sa.Integer),
    sa.column('nombre_rol', sa.String),
)


def upgrade() -> None:
    op.bulk_insert(roles_table, [
        {'nombre_rol': 'admin'},
        {'nombre_rol': 'cliente'},
        {'nombre_rol': 'empleado'},
        {'nombre_rol': 'supervisor'},
        {'nombre_rol': 'gerente'},
        {'nombre_rol': 'agente_ventas'},
        {'nombre_rol': 'soporte'},
        {'nombre_rol': 'guia_turistico'},
        {'nombre_rol': 'auditor'},
        {'nombre_rol': 'marketing'},
    ])


def downgrade() -> None:
    op.execute("DELETE FROM roles WHERE nombre_rol IN ('admin','cliente','empleado','supervisor','gerente','agente_ventas','soporte','guia_turistico','auditor','marketing')")
