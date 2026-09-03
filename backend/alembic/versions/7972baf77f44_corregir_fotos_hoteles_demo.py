"""corregir fotos de hoteles demo mal asignadas

Revision ID: 7972baf77f44
Revises: 8bc27e1e11bf
Create Date: 2026-09-03 00:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "7972baf77f44"
down_revision: Union[str, None] = "8bc27e1e11bf"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# La migración 6a87622a7a6e usó IDs de foto de Unsplash que no se
# verificaron visualmente antes de guardarlos -- varias resultaron ser
# fotos completamente ajenas al hotel (un torno de carpintería para un
# resort de playa, gente tomada de la mano para una cabaña de montaña,
# granos de café para una cabaña de bosque, el templo de Borobudur para un
# hotel boutique, un paisaje nevado para un "Plaza Mayor", una bahía de
# Asia para un hotel "pachanguero" en Cali) y una (EcoLodge Tayrona)
# apuntaba a un ID que ni siquiera existe (404). Después, 8bc27e1e11bf
# subió esas mismas fotos (equivocadas) a Cloudinary, así que hoy el dato
# malo puede estar en cualquiera de dos formas según si ese paso ya corrió:
# la URL de Unsplash original, o la URL de Cloudinary con el contenido
# equivocado. Esta migración corrige ambos casos a la vez, verificados uno
# por uno abriendo cada imagen nueva antes de guardarla acá.
#
# nombre_hotel -> (URL(s) equivocadas que puede tener hoy, URL corregida)
CORRECCIONES: dict[str, tuple[list[str], str]] = {
    "Resort Sol y Arena": (
        [
            "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80",
            "https://res.cloudinary.com/urvnvwir/image/upload/v1788396744/alectours/hoteles/resort-sol-y-arena.jpg",
        ],
        "https://images.unsplash.com/photo-1658591049748-4937f0a9051a?w=1200&q=80",
    ),
    "Montana Magica": (
        [
            "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=1200&q=80",
            "https://res.cloudinary.com/urvnvwir/image/upload/v1788396745/alectours/hoteles/montana-magica.jpg",
        ],
        "https://images.unsplash.com/photo-1570793005386-840846445fed?w=1200&q=80",
    ),
    "Cabanas del Bosque": (
        [
            "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=1200&q=80",
            "https://res.cloudinary.com/urvnvwir/image/upload/v1788396746/alectours/hoteles/cabanas-del-bosque.jpg",
        ],
        "https://images.unsplash.com/photo-1749063240369-391a2e82dc04?w=1200&q=80",
    ),
    "Plaza Mayor Hotel": (
        [
            "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80",
            "https://res.cloudinary.com/urvnvwir/image/upload/v1788396746/alectours/hoteles/plaza-mayor-hotel.jpg",
        ],
        "https://images.unsplash.com/photo-1788203816802-5fa9a5086f27?w=1200&q=80",
    ),
    "Boutique Santa Marta": (
        [
            "https://images.unsplash.com/photo-1596402184320-417e7178b2cd?w=1200&q=80",
            "https://res.cloudinary.com/urvnvwir/image/upload/v1788396747/alectours/hoteles/boutique-santa-marta.jpg",
        ],
        "https://images.unsplash.com/photo-1788184851263-f832bf6c76f3?w=1200&q=80",
    ),
    "EcoLodge Tayrona": (
        [
            # Esta nunca llegó a subirse a Cloudinary: el ID de Unsplash de
            # 6a87622a7a6e daba 404, así que subir_imagenes_hoteles_cloudinary.py
            # la saltó y este hotel se quedó con la URL rota.
            "https://images.unsplash.com/photo-1542314831-c6a4d140f6c2?w=800&q=80",
        ],
        "https://images.unsplash.com/photo-1770823232388-adb591775e55?w=1200&q=80",
    ),
    "Cali Pachanguero H.": (
        [
            "https://images.unsplash.com/photo-1531761535209-180857e963b9?w=1200&q=80",
            "https://res.cloudinary.com/urvnvwir/image/upload/v1788396749/alectours/hoteles/cali-pachanguero-h.jpg",
        ],
        "https://images.unsplash.com/photo-1758165532022-a68f291317ba?w=1200&q=80",
    ),
}

# "Hotel Paraiso", "Gran Hotel Centro" y "Hotel Imperial" sí se verificaron
# y coinciden con lo esperado -- no se tocan acá, en ninguna de sus dos
# formas (Unsplash o Cloudinary).

_UPDATE_SQL = sa.text(
    "UPDATE hoteles SET imagen_url = :nueva WHERE nombre_hotel = :nombre AND imagen_url = :vieja"
)


def upgrade() -> None:
    conn = op.get_bind()
    for nombre, (viejas, nueva) in CORRECCIONES.items():
        for vieja in viejas:
            conn.execute(
                _UPDATE_SQL, {"nueva": nueva, "nombre": nombre, "vieja": vieja}
            )


def downgrade() -> None:
    # No tiene sentido volver a una foto que sabemos que está equivocada
    # (mismo criterio ya usado en 8bc27e1e11bf).
    pass
