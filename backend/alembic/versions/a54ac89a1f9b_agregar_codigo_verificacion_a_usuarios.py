"""agregar codigo de verificacion (OTP) a usuarios

Revision ID: a54ac89a1f9b
Revises: 7a2f19c0d5e4
Create Date: 2026-09-15 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'a54ac89a1f9b'
down_revision = '7a2f19c0d5e4'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Antes, verificar la cuenta solo era posible dando clic al enlace del
    # correo (token JWT largo, sin estado en la base de datos -- ver
    # create_verification_token/verify_verification_token en security.py).
    # Eso obliga a abrir el correo en el mismo dispositivo o copiar un link
    # larguísimo a mano. Se agrega un código corto (6 dígitos) que el
    # usuario puede simplemente TECLEAR de vuelta en la pestaña donde se
    # registró -- el enlace del correo se conserva funcionando igual que
    # antes, este es un segundo camino, no un reemplazo.
    #
    # Se guarda solo el HASH del código (mismo criterio que password_hash:
    # nunca en texto plano), con su propia expiración corta (15 min, más
    # corta que las 24h del enlace porque este flujo asume que la persona
    # sigue ahí mismo esperando el código) y un contador de intentos
    # fallidos para no permitir fuerza bruta sobre solo 10^6 combinaciones
    # posibles antes de que expire.
    op.add_column('usuarios', sa.Column('codigo_verificacion_hash', sa.String(length=255), nullable=True))
    op.add_column('usuarios', sa.Column('codigo_verificacion_expira', sa.TIMESTAMP(), nullable=True))
    op.add_column(
        'usuarios',
        sa.Column('intentos_verificacion', sa.Integer(), nullable=False, server_default='0'),
    )


def downgrade() -> None:
    op.drop_column('usuarios', 'intentos_verificacion')
    op.drop_column('usuarios', 'codigo_verificacion_expira')
    op.drop_column('usuarios', 'codigo_verificacion_hash')
