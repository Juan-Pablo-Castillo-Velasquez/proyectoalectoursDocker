"""crear tabla mensajes_chat

Revision ID: 5de84d20f91e
Revises: a54ac89a1f9b
Create Date: 2026-09-17 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '5de84d20f91e'
down_revision: Union[str, None] = 'a54ac89a1f9b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Chat privado admin<->cliente -- un solo hilo continuo por cliente (no
    # uno por reserva), bandeja compartida (cualquier admin ve/responde
    # cualquier hilo). No existe tabla de "hilo" separada: el hilo de un
    # cliente es "todos los mensajes_chat con ese id_cliente".
    op.create_table(
        'mensajes_chat',
        sa.Column('id_mensaje', sa.Integer(), nullable=False),
        sa.Column('id_cliente', sa.Integer(), nullable=False),
        sa.Column('id_usuario_remitente', sa.Integer(), nullable=False),
        sa.Column('remitente_tipo', sa.String(length=20), nullable=False),
        sa.Column('contenido', sa.String(), nullable=True),
        sa.Column('imagen_url', sa.String(), nullable=True),
        sa.Column('leido', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('fecha_envio', sa.TIMESTAMP(), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['id_cliente'], ['clientes.id_cliente'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['id_usuario_remitente'], ['usuarios.id_usuario'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id_mensaje'),
    )
    op.create_index(op.f('ix_mensajes_chat_id_mensaje'), 'mensajes_chat', ['id_mensaje'], unique=False)
    op.create_index(op.f('ix_mensajes_chat_id_cliente'), 'mensajes_chat', ['id_cliente'], unique=False)
    # Cubre tanto "contar no-leidos de tipo X para este cliente" como
    # "marcar leidos los de tipo X de este cliente" -- la consulta mas
    # frecuente de este modulo (corre en cada ciclo de polling).
    op.create_index(
        'ix_mensajes_chat_cliente_tipo_leido',
        'mensajes_chat',
        ['id_cliente', 'remitente_tipo', 'leido'],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index('ix_mensajes_chat_cliente_tipo_leido', table_name='mensajes_chat')
    op.drop_index(op.f('ix_mensajes_chat_id_cliente'), table_name='mensajes_chat')
    op.drop_index(op.f('ix_mensajes_chat_id_mensaje'), table_name='mensajes_chat')
    op.drop_table('mensajes_chat')
