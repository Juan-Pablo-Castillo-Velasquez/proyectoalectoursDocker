from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from app.schemas.hotel_schema import HotelDetailResponse


class FavoritoCreate(BaseModel):
    id_hotel: int


class FavoritoResponse(BaseModel):
    id_favorito: int
    id_hotel: int
    fecha_creacion: Optional[datetime] = None
    hotel: Optional[HotelDetailResponse] = None

    class Config:
        from_attributes = True
