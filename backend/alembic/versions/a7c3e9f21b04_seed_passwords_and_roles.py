"""arreglar password_hash y roles de los usuarios semilla + admin de prueba

Revision ID: a7c3e9f21b04
Revises: f4a9c1d8b2e3
Create Date: 2026-08-25 02:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a7c3e9f21b04'
down_revision: Union[str, None] = 'f4a9c1d8b2e3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Hash bcrypt real para la contraseña "Cliente1234!" (generado con
# app.core.security.hash_password, la misma función que usa el backend).
_CLIENTE_HASH = "$2b$12$x7WABj1Ze4HuICVZwatKv.OIIRDSGvH0lrnI39i8fP2ZT.WN9cxKC"
# Hash bcrypt real para la contraseña "Admin1234!".
_ADMIN_HASH = "$2b$12$f2DaXti0iugxsf45u9humuEPGOHR6LT6zkfBKC8k75NtcRPeBcLPO"

_SEED_USERNAMES = (
    'juanp', 'mariag', 'carlosl', 'anam', 'luisr',
    'andresc', 'camilav', 'javierr', 'nataliam', 'felipeg',
)
_CLIENTE_USERNAMES = ('juanp', 'mariag', 'carlosl', 'anam', 'luisr')
_EMPLEADO_USERNAMES = ('andresc', 'camilav', 'javierr', 'nataliam', 'felipeg')


def upgrade() -> None:
    # 0) La columna `usuarios.activo` se creó sin default a nivel de motor
    #    (ver 49b74c185f93_esquema_inicial.py), así que cualquier INSERT que
    #    no la mencione explícitamente (como el seed de db_schema.sql) queda
    #    en NULL en vez de TRUE. Se normaliza el dato existente y se agrega
    #    el default para que no vuelva a pasar.
    op.execute("UPDATE usuarios SET activo = TRUE WHERE activo IS NULL")
    op.alter_column('usuarios', 'activo', server_default=sa.text('true'))

    # 1) Reparar password_hash de los usuarios semilla conocidos (los que
    #    todavía tengan el placeholder no-bcrypt 'hash12345'). No toca
    #    ninguna cuenta real creada por registro normal.
    op.execute(
        f"""
        UPDATE usuarios SET password_hash = '{_CLIENTE_HASH}'
        WHERE username IN {_SEED_USERNAMES!r} AND password_hash = 'hash12345'
        """
    )

    # 2) Crear el admin de prueba por defecto si todavía no existe.
    op.execute(
        f"""
        INSERT INTO usuarios (username, correo_electronico, password_hash, activo, verificado)
        SELECT 'admin', 'admin@alektours.com', '{_ADMIN_HASH}', TRUE, TRUE
        WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE username = 'admin')
        """
    )

    # 3) Asignar roles a los usuarios semilla + admin (antes no tenían
    #    ninguna fila en usuarios_roles).
    op.execute(
        f"""
        INSERT INTO usuarios_roles (id_usuario, id_rol)
        SELECT u.id_usuario, r.id_rol
        FROM usuarios u, roles r
        WHERE u.username IN {_CLIENTE_USERNAMES!r} AND r.nombre_rol = 'cliente'
        ON CONFLICT DO NOTHING
        """
    )
    op.execute(
        f"""
        INSERT INTO usuarios_roles (id_usuario, id_rol)
        SELECT u.id_usuario, r.id_rol
        FROM usuarios u, roles r
        WHERE u.username IN {_EMPLEADO_USERNAMES!r} AND r.nombre_rol = 'empleado'
        ON CONFLICT DO NOTHING
        """
    )
    op.execute(
        """
        INSERT INTO usuarios_roles (id_usuario, id_rol)
        SELECT u.id_usuario, r.id_rol
        FROM usuarios u, roles r
        WHERE u.username = 'admin' AND r.nombre_rol = 'admin'
        ON CONFLICT DO NOTHING
        """
    )


def downgrade() -> None:
    op.execute("DELETE FROM usuarios_roles WHERE id_usuario IN (SELECT id_usuario FROM usuarios WHERE username = 'admin')")
    op.execute("DELETE FROM usuarios WHERE username = 'admin'")
