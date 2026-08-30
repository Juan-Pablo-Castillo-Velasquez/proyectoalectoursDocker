from sqlalchemy import TIMESTAMP, Column, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Favorito(Base):
    __tablename__ = "favoritos"
    __table_args__ = (UniqueConstraint("id_cliente", "id_hotel", name="uq_favoritos_cliente_hotel"),)

    id_favorito = Column(Integer, primary_key=True, index=True)
    id_cliente = Column(Integer, ForeignKey("clientes.id_cliente", ondelete="CASCADE"), nullable=False)
    id_hotel = Column(Integer, ForeignKey("hoteles.id_hotel", ondelete="CASCADE"), nullable=False)
    fecha_creacion = Column(TIMESTAMP, server_default=func.now())

    cliente = relationship("Cliente")
    hotel = relationship("Hotel")
