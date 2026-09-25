"""agregar celular_nequi a pagos

Revision ID: 10e71d8eaa4e
Revises: a54ac89a1f9b
Create Date: 2026-09-25 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '10e71d8eaa4e'
down_revision: Union[str, None] = 'a54ac89a1f9b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # El celular Nequi que el cliente escribe en el checkout (ver
    # NequiPayment.tsx) solo se usaba antes para decidir la simulación de
    # rechazo (payment_service.py) y se descartaba -- nunca quedaba
    # guardado. Ahora que un asesor/admin tiene que verificar de verdad la
    # transferencia (ver confirmar_pago en reserva_route.py), necesita
    # poder ver desde qué número el cliente dice haber enviado la plata.
    op.add_column('pagos', sa.Column('celular_nequi', sa.String(length=15), nullable=True))


def downgrade() -> None:
    op.drop_column('pagos', 'celular_nequi')
