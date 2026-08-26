"""metodos_pago.codigo + estados procesando/cancelado en pagos

Revision ID: d4c8a1f39b02
Revises: a7c3e9f21b04
Create Date: 2026-08-26 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd4c8a1f39b02'
down_revision: Union[str, None] = 'a7c3e9f21b04'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Nombre real sembrado en 523e6283e58b -> codigo estable para el backend
# (evita comparar el nombre en español con regex para decidir el flujo).
_CODIGO_MAP = {
    'Tarjeta de Credito': 'tarjeta_credito',
    'Tarjeta de Debito': 'tarjeta_debito',
    'Efectivo': 'efectivo',
    'Transferencia Bancaria': 'transferencia',
    'PayPal': 'paypal',
    'Criptomonedas': 'cripto',
    'Nequi': 'nequi',
    'Daviplata': 'daviplata',
    'PSE': 'pse',
    'Cheque': 'cheque',
}


def upgrade() -> None:
    # 1) metodos_pago.codigo
    op.add_column('metodos_pago', sa.Column('codigo', sa.String(length=30), nullable=True))

    for nombre, codigo in _CODIGO_MAP.items():
        nombre_esc = nombre.replace("'", "''")
        op.execute(f"UPDATE metodos_pago SET codigo = '{codigo}' WHERE nombre_metodo = '{nombre_esc}'")

    # Cualquier método creado manualmente que no coincida con el mapa
    # conocido cae en 'otro' (se resuelve siempre al instante, como hoy).
    op.execute("UPDATE metodos_pago SET codigo = 'otro' WHERE codigo IS NULL")
    op.alter_column('metodos_pago', 'codigo', nullable=False)

    # 2) pagos: nuevos estados 'procesando' y 'cancelado' para poder simular
    #    el flujo asincrono real de PSE/Nequi (PENDING -> PROCESSING ->
    #    APPROVED/REJECTED), sin tocar el resto del modelo.
    op.execute("ALTER TABLE pagos DROP CONSTRAINT IF EXISTS pagos_estado_check")
    op.execute(
        "ALTER TABLE pagos ADD CONSTRAINT pagos_estado_check "
        "CHECK (estado IN ('pendiente', 'procesando', 'pagado', 'rechazado', 'cancelado'))"
    )

    # 3) pagos.simular_rechazo: decidido en el momento de iniciar el pago
    #    (con los valores de prueba de tarjeta/celular/documento) y resuelto
    #    al confirmar (ver POST /api/pagos/{id}/confirmar).
    op.add_column(
        'pagos',
        sa.Column('simular_rechazo', sa.Boolean(), nullable=False, server_default=sa.text('false')),
    )


def downgrade() -> None:
    op.drop_column('pagos', 'simular_rechazo')
    op.execute("ALTER TABLE pagos DROP CONSTRAINT IF EXISTS pagos_estado_check")
    op.execute(
        "ALTER TABLE pagos ADD CONSTRAINT pagos_estado_check "
        "CHECK (estado IN ('pendiente', 'pagado', 'rechazado'))"
    )
    op.drop_column('metodos_pago', 'codigo')
