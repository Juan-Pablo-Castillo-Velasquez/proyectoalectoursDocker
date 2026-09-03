"""poblar imagen_url de los hoteles demo

Revision ID: 6a87622a7a6e
Revises: ca501a57430f
Create Date: 2026-09-03 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '6a87622a7a6e'
down_revision: Union[str, None] = 'ca501a57430f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Fotos reales (Unsplash, license-free) por hotel de los datos demo (ver
# 523e6283e58b_seed_datos_demo.py) — reutiliza las mismas URLs ya usadas
# como respaldo en CITY_IMAGES/GALLERY_FILLERS del frontend
# (HotelCard.tsx/HotelDetail.tsx), así no se depende de ningún host nuevo
# ni hace falta que un admin las suba a mano. Antes de esto, todo hotel de
# una misma ciudad se veía con la foto genérica idéntica.
FOTOS_POR_HOTEL = {
    "Hotel Paraiso": "https://images.unsplash.com/photo-1605723517503-3cadb5818a0c?w=1200&q=80",
    "Resort Sol y Arena": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80",
    "Montana Magica": "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=1200&q=80",
    "Gran Hotel Centro": "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80",
    "Cabanas del Bosque": "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=1200&q=80",
    "Plaza Mayor Hotel": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80",
    "Boutique Santa Marta": "https://images.unsplash.com/photo-1596402184320-417e7178b2cd?w=1200&q=80",
    "EcoLodge Tayrona": "https://images.unsplash.com/photo-1542314831-c6a4d140f6c2?w=800&q=80",
    "Hotel Imperial": "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&q=80",
    "Cali Pachanguero H.": "https://images.unsplash.com/photo-1531761535209-180857e963b9?w=1200&q=80",
}

_UPDATE_SQL = sa.text(
    "UPDATE hoteles SET imagen_url = :url WHERE nombre_hotel = :nombre AND imagen_url IS NULL"
)
_DOWNGRADE_SQL = sa.text(
    "UPDATE hoteles SET imagen_url = NULL WHERE nombre_hotel = :nombre AND imagen_url = :url"
)


def upgrade() -> None:
    conn = op.get_bind()
    for nombre, url in FOTOS_POR_HOTEL.items():
        # imagen_url IS NULL: nunca pisa una foto que un admin ya haya
        # subido de verdad (ver POST /api/hoteles/{id}/imagen) — esto es
        # solo para que los hoteles demo dejen de verse todos iguales.
        conn.execute(_UPDATE_SQL, {"url": url, "nombre": nombre})


def downgrade() -> None:
    conn = op.get_bind()
    for nombre, url in FOTOS_POR_HOTEL.items():
        conn.execute(_DOWNGRADE_SQL, {"url": url, "nombre": nombre})
