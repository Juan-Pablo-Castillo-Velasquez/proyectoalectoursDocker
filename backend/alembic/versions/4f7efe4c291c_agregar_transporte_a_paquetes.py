"""agregar transporte real a paquetes que no tenian ningun servicio de esa categoria

Revision ID: 4f7efe4c291c
Revises: 32703b04b6a8
Create Date: 2026-09-03 12:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "4f7efe4c291c"
down_revision: Union[str, None] = "32703b04b6a8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# El usuario reportó que la ficha de "Aventura Paisa" (paquete 2) se sentía
# incompleta: aparte del hotel, solo tenía UNA actividad (Escalada Peñol) y
# ningún tramo de transporte. Revisando paquete_servicios (ver
# 523e6283e58b_seed_datos_demo.py) esto es real: 5 de los 10 paquetes demo
# (2, 4, 5, 6, 7) no tienen ningún servicio de categoría "Transporte", pese
# a que casi todos combinan una ciudad de hospedaje con un destino distinto
# (ej. el paquete 2 hospeda en Medellín pero la actividad es en Guatapé).
# Se agrega un tramo de transporte real y geográficamente coherente a cada
# uno de esos 5, usando únicamente destinos/categorías que YA existen en la
# base de datos -- nunca se inventa un hotel ni un destino nuevo.
#
# Los paquetes 8, 9 y 10 quedan fuera de esta migración a propósito: no
# tienen NINGÚN servicio (8, 9, 10) ni (10) ningún hotel asignado todavía.
# Arreglarlos de verdad requeriría inventar un hotel/destino que hoy no
# existe en la base de datos demo, así que se reportan como un hallazgo
# aparte en vez de fabricar esos datos acá.
_TRANSPORTES = [
    # (id_paquete, nombre_servicio, descripcion, nombre_destino, dia_actividad, duracion_horas, precio_base, capacidad_maxima)
    (
        2,
        "Transporte terrestre Medellin - Guatape y El Penol",
        "Traslado en bus turistico ida y vuelta desde Medellin hasta Guatape, con parada en El Penol.",
        "Piedra del Penol",
        1,
        2.5,
        55000.00,
        40,
    ),
    (
        4,
        "Traslado terrestre Armenia - Salento",
        "Transporte terrestre desde el aeropuerto de Armenia hasta Salento.",
        "Valle del Cocora",
        1,
        1.0,
        35000.00,
        20,
    ),
    (
        5,
        "Transporte aereo Neiva - La Macarena",
        "Vuelo en avioneta desde Neiva hasta La Macarena, unico acceso real a la zona de Cano Cristales.",
        "Cano Cristales",
        3,
        1.5,
        380000.00,
        15,
    ),
    (
        6,
        "Vuelo Bogota - San Andres",
        "Tiquete aereo ida y vuelta Bogota - San Andres incluido en el paquete.",
        "Isla de San Andres",
        1,
        2.5,
        420000.00,
        180,
    ),
    (
        7,
        "Transporte terrestre Pasto - Ipiales",
        "Traslado en bus desde Pasto hasta el Santuario de Las Lajas en Ipiales.",
        "Santuario de Las Lajas",
        1,
        1.5,
        40000.00,
        40,
    ),
]

_INSERT_SERVICIO = sa.text(
    """
    INSERT INTO servicios
        (nombre_servicio, descripcion, id_categoria, id_destino, duracion_horas, precio_base, capacidad_maxima)
    SELECT :nombre, :descripcion, cat.id_categoria, dest.id_destino, :duracion, :precio, :capacidad
    FROM categoria_servicio cat, destinos dest
    WHERE cat.nombre_categoria = 'Transporte' AND dest.nombre_destino = :destino
    RETURNING id_servicio
    """
)

_INSERT_PAQUETE_SERVICIO = sa.text(
    "INSERT INTO paquete_servicios (id_paquete, id_servicio, dia_actividad, incluido) "
    "VALUES (:id_paquete, :id_servicio, :dia, TRUE)"
)


def upgrade() -> None:
    conn = op.get_bind()
    for id_paquete, nombre, descripcion, destino, dia, duracion, precio, capacidad in _TRANSPORTES:
        # Idempotente: si esta migracion ya corrio antes (o el entorno se
        # re-ejecuta a mano, como ya paso esta sesion con otras migraciones
        # de datos), no duplicar el mismo servicio de transporte.
        ya_existe = conn.execute(
            sa.text("SELECT 1 FROM servicios WHERE nombre_servicio = :nombre"),
            {"nombre": nombre},
        ).first()
        if ya_existe:
            continue

        id_servicio = conn.execute(
            _INSERT_SERVICIO,
            {
                "nombre": nombre,
                "descripcion": descripcion,
                "destino": destino,
                "duracion": duracion,
                "precio": precio,
                "capacidad": capacidad,
            },
        ).scalar_one()

        conn.execute(
            _INSERT_PAQUETE_SERVICIO,
            {"id_paquete": id_paquete, "id_servicio": id_servicio, "dia": dia},
        )


def downgrade() -> None:
    conn = op.get_bind()
    for _id_paquete, nombre, *_resto in _TRANSPORTES:
        conn.execute(
            sa.text(
                "DELETE FROM paquete_servicios WHERE id_servicio IN "
                "(SELECT id_servicio FROM servicios WHERE nombre_servicio = :nombre)"
            ),
            {"nombre": nombre},
        )
        conn.execute(sa.text("DELETE FROM servicios WHERE nombre_servicio = :nombre"), {"nombre": nombre})
