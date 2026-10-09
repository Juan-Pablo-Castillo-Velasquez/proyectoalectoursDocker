"""merge heads

Revision ID: 7e3b45184503
Revises: 10e71d8eaa4e, a8d1f9fc91d6
Create Date: 2026-10-09 15:03:21.750461

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7e3b45184503'
down_revision: Union[str, None] = ('10e71d8eaa4e', 'a8d1f9fc91d6')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
