"""merge heads

Revision ID: f99809c2e56d
Revises: 7e3b45184503
Create Date: 2026-10-09 15:03:42.767722

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f99809c2e56d'
down_revision: Union[str, None] = '7e3b45184503'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
