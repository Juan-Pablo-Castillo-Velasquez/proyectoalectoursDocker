from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.cache import get_cached, set_cached
from app.repositories.hotel_repository import HotelRepository

router = APIRouter(prefix="/api/promociones", tags=["Promociones"])

# Imágenes de respaldo (mismas que ya usabas en el frontend estático).
# La tabla `hoteles` no guarda imágenes, así que rotamos entre estas.
IMAGENES_FALLBACK = [
    "https://images.unsplash.com/photo-1552074284-5e88ef1aef18?q=80&w=900&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?q=80&w=900&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?q=80&w=900&auto=format&fit=crop",
]

# Igual que las imágenes: la tabla no guarda "noches sugeridas", así que rotamos.
NOCHES_FALLBACK = [
    "3 noches · 2 adultos",
    "5 noches · 2 adultos",
    "4 noches · 2 adultos",
    "3 noches · 2 adultos",
]


@router.get("/destacados")
def get_destacados(db: Session = Depends(get_db)):
    cached = get_cached("home:destacados")
    if cached:
        return cached

    filas = HotelRepository.get_destacados(db, limit=3)

    data = []
    for i, fila in enumerate(filas):
        precio = float(fila.precio_desde or 0)
        data.append({
            "id": fila.id_hotel,
            "title": fila.nombre_hotel,
            "tag": f"{fila.ciudad}, {fila.pais}",
            "discount": f"★ {fila.calificacion}",
            "price": f"{precio:,.0f}".replace(",", "."),
            "oldPrice": "",
            "img": IMAGENES_FALLBACK[i % len(IMAGENES_FALLBACK)],
        })

    set_cached("home:destacados", data, ttl_seconds=600)  # 10 min
    return data


@router.get("/seleccion-casa")
def get_seleccion_casa(db: Session = Depends(get_db)):
    cached = get_cached("home:seleccion_casa")
    if cached:
        return cached

    # offset=3 para no repetir los 3 hoteles que ya salen en /destacados
    filas = HotelRepository.get_seleccion_casa(db, limit=4, offset=3)

    data = []
    for i, fila in enumerate(filas):
        precio = float(fila.precio_desde or 0)
        data.append({
            "id": fila.id_hotel,
            "name": fila.nombre_hotel,
            "tag": f"{fila.ciudad}, {fila.pais}",
            "img": IMAGENES_FALLBACK[i % len(IMAGENES_FALLBACK)],
            "rating": float(fila.calificacion),
            "price": f"{precio:,.0f}".replace(",", "."),
            "nights": NOCHES_FALLBACK[i % len(NOCHES_FALLBACK)],
        })

    set_cached("home:seleccion_casa", data, ttl_seconds=600)  # 10 min
    return data