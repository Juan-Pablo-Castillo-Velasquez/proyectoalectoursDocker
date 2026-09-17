"""agregar id_reserva a mensajes_chat

Revision ID: 389bd84211cf
Revises: 5de84d20f91e
Create Date: 2026-09-17 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '389bd84211cf'
down_revision: Union[str, None] = '5de84d20f91e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Permite etiquetar opcionalmente un mensaje del chat con la reserva de
    # la que se está hablando -- nullable (la mayoría de mensajes no hablan
    # de ninguna reserva en particular). SET NULL (no CASCADE): si la
    # reserva se borra, el mensaje y el resto de la conversación deben
    # sobrevivir, solo pierde la etiqueta -- misma convención que
    # Reserva.id_empleado (FK opcional) en reserva_model.py.
    op.add_column('mensajes_chat', sa.Column('id_reserva', sa.Integer(), nullable=True))
    op.create_foreign_key(
        'fk_mensajes_chat_id_reserva_reservas',
        'mensajes_chat',
        'reservas',
        ['id_reserva'],
        ['id_reserva'],
        ondelete='SET NULL',
    )


def downgrade() -> None:
    op.drop_constraint('fk_mensajes_chat_id_reserva_reservas', 'mensajes_chat', type_='foreignkey')
    op.drop_column('mensajes_chat', 'id_reserva')
