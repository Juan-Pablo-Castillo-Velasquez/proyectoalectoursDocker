"""arreglar empleados.activo en NULL (mismo bug que usuarios.activo)

Revision ID: b2f6a184e9d3
Revises: 5b3d408e912a
Create Date: 2026-09-01 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b2f6a184e9d3'
down_revision: Union[str, None] = '5b3d408e912a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Mismo bug ya arreglado para usuarios.activo en a7c3e9f21b04, pero
    # nunca se aplicó a empleados.activo: la columna se creó sin default a
    # nivel de motor (esquema inicial, 49b74c185f93), así que el seed de
    # empleados (INSERT directo por SQL, no vía el ORM) la dejó en NULL en
    # vez de TRUE. Empleado.activo (cliente_model.py) está tipado como
    # Boolean no-opcional en EmpleadoResponse — con activo=NULL en la
    # tabla, GET /api/empleados falla siempre con 500 (error real de
    # validación de Pydantic, verificado en vivo contra los 10 empleados
    # semilla, todos con activo NULL).
    op.execute("UPDATE empleados SET activo = TRUE WHERE activo IS NULL")
    op.alter_column('empleados', 'activo', server_default=sa.text('true'))


def downgrade() -> None:
    op.alter_column('empleados', 'activo', server_default=None)
