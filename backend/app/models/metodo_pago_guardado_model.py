from sqlalchemy import Column, Integer, String, Boolean, TIMESTAMP, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class MetodoPagoGuardado(Base):
    """
    Método de pago guardado por el cliente para usar en futuras reservas.

    Por seguridad NUNCA se guarda un número de tarjeta/cuenta completo ni
    ningún dato sensible real — solo un alias visible, los últimos 4
    dígitos (igual que en el flujo de pago existente, ver
    reserva_service.pagar/PagarRequest, que tampoco acepta el número
    completo) y una clave de confirmación de 4 a 6 dígitos guardada como
    hash bcrypt (mismo mecanismo que las contraseñas de usuario en
    app.core.security.hash_password), nunca en texto plano. Esa clave se
    vuelve a pedir al cliente para confirmar que es él quien autoriza usar
    este método guardado en un pago.
    """
    __tablename__ = "metodos_pago_guardados"

    id_metodo_guardado = Column(Integer, primary_key=True, index=True)
    id_cliente = Column(Integer, ForeignKey("clientes.id_cliente", ondelete="CASCADE"), nullable=False)
    alias = Column(String(50), nullable=False)
    tipo = Column(String(30), nullable=False)
    ultimos4 = Column(String(4))
    clave_hash = Column(String(255), nullable=False)
    predeterminado = Column(Boolean, default=False, nullable=False)
    fecha_creacion = Column(TIMESTAMP, server_default=func.now())

    cliente = relationship("Cliente")
