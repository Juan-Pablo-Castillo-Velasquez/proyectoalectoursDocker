"""crear tablas permisos y roles_permisos

Revision ID: 5d2370d4474f
Revises: efa1e108ca6b
Create Date: 2026-09-15 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5d2370d4474f'
down_revision: Union[str, None] = 'efa1e108ca6b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Catálogo fijo de permisos que el backend realmente conoce y aplica (ver
# require_permission en app/core/deps.py). Cada clave de acá corresponde a
# una llamada real a require_permission("...") en algún endpoint hoy, o
# queda lista para engancharse en una fase siguiente sin necesitar otra
# migración -- agregar una fila acá sin el chequeo correspondiente en el
# código no habilita nada por sí sola.
PERMISOS = [
    ('usuarios.gestionar', 'Gestionar usuarios', 'Usuarios'),
    ('roles.gestionar', 'Gestionar roles y permisos', 'Roles y permisos'),
    ('reservas.ver', 'Ver reservas', 'Reservas'),
    ('reservas.gestionar', 'Crear, editar y cancelar reservas', 'Reservas'),
    ('cancelaciones.gestionar', 'Resolver solicitudes de cancelación', 'Cancelaciones'),
    ('clientes.ver', 'Ver clientes', 'Clientes'),
    ('clientes.gestionar', 'Crear, editar y eliminar clientes', 'Clientes'),
    ('hoteles.ver', 'Ver hoteles', 'Hoteles'),
    ('hoteles.gestionar', 'Crear, editar y eliminar hoteles', 'Hoteles'),
    ('paquetes.ver', 'Ver paquetes turísticos', 'Paquetes'),
    ('paquetes.gestionar', 'Crear, editar y eliminar paquetes', 'Paquetes'),
    ('empresas.gestionar', 'Gestionar solicitudes corporativas', 'Empresas'),
    ('pagos.ver', 'Ver pagos', 'Pagos'),
    ('pagos.gestionar', 'Editar estado y comprobantes de pagos', 'Pagos'),
    ('banners.gestionar', 'Gestionar banners y promociones', 'Promociones'),
    ('temas.gestionar', 'Gestionar temas de temporada', 'Promociones'),
    ('notificaciones.ver', 'Ver notificaciones del sistema', 'Comunicación'),
    ('actividad.ver', 'Ver actividad del sistema', 'Sistema'),
    ('configuracion.gestionar', 'Editar configuración del sistema', 'Sistema'),
]

permisos_table = sa.table(
    'permisos',
    sa.column('id_permiso', sa.Integer),
    sa.column('clave', sa.String),
    sa.column('nombre', sa.String),
    sa.column('categoria', sa.String),
)

roles_permisos_table = sa.table(
    'roles_permisos',
    sa.column('id_rol', sa.Integer),
    sa.column('id_permiso', sa.Integer),
)

roles_table = sa.table(
    'roles',
    sa.column('id_rol', sa.Integer),
    sa.column('nombre_rol', sa.String),
)


def upgrade() -> None:
    op.create_table(
        'permisos',
        sa.Column('id_permiso', sa.Integer(), nullable=False),
        sa.Column('clave', sa.String(length=80), nullable=False),
        sa.Column('nombre', sa.String(length=120), nullable=False),
        sa.Column('categoria', sa.String(length=50), nullable=False),
        sa.PrimaryKeyConstraint('id_permiso'),
        sa.UniqueConstraint('clave'),
    )
    op.create_index(op.f('ix_permisos_id_permiso'), 'permisos', ['id_permiso'], unique=False)

    op.create_table(
        'roles_permisos',
        sa.Column('id_rol', sa.Integer(), nullable=False),
        sa.Column('id_permiso', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['id_rol'], ['roles.id_rol'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['id_permiso'], ['permisos.id_permiso'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id_rol', 'id_permiso'),
    )

    conn = op.get_bind()

    op.bulk_insert(
        permisos_table,
        [{'clave': clave, 'nombre': nombre, 'categoria': categoria} for clave, nombre, categoria in PERMISOS],
    )

    # El rol 'admin' recibe automáticamente TODOS los permisos recién
    # sembrados -- esto es lo que garantiza que ningún admin existente
    # pierda acceso a nada con este cambio. require_permission (deps.py)
    # además deja pasar a 'admin' sin siquiera consultar esta tabla, igual
    # que require_admin ya hacía -- esta asignación es sobre todo para que
    # el nuevo panel de "Roles y permisos" muestre a 'admin' con todo
    # marcado, en vez de aparecer vacío pese a tener acceso total.
    admin = conn.execute(
        sa.select(roles_table.c.id_rol).where(roles_table.c.nombre_rol == 'admin')
    ).first()
    if admin:
        id_rol_admin = admin[0]
        permisos_creados = conn.execute(sa.select(permisos_table.c.id_permiso)).fetchall()
        op.bulk_insert(
            roles_permisos_table,
            [{'id_rol': id_rol_admin, 'id_permiso': p[0]} for p in permisos_creados],
        )


def downgrade() -> None:
    op.drop_table('roles_permisos')
    op.drop_index(op.f('ix_permisos_id_permiso'), table_name='permisos')
    op.drop_table('permisos')
