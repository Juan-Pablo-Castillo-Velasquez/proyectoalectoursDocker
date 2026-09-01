from sqlalchemy.orm import Session

from app.models.metodo_pago_guardado_model import MetodoPagoGuardado


class MetodoPagoGuardadoRepository:
    @staticmethod
    def get_by_cliente(db: Session, id_cliente: int):
        return (
            db.query(MetodoPagoGuardado)
            .filter(MetodoPagoGuardado.id_cliente == id_cliente)
            .order_by(MetodoPagoGuardado.predeterminado.desc(), MetodoPagoGuardado.fecha_creacion.desc())
            .all()
        )

    @staticmethod
    def get_by_id(db: Session, id_cliente: int, id_metodo_guardado: int):
        return (
            db.query(MetodoPagoGuardado)
            .filter(
                MetodoPagoGuardado.id_metodo_guardado == id_metodo_guardado,
                MetodoPagoGuardado.id_cliente == id_cliente,
            )
            .first()
        )

    @staticmethod
    def create(
        db: Session, id_cliente: int, alias: str, tipo: str, ultimos4, clave_hash: str, predeterminado: bool
    ) -> MetodoPagoGuardado:
        if predeterminado:
            db.query(MetodoPagoGuardado).filter(MetodoPagoGuardado.id_cliente == id_cliente).update(
                {MetodoPagoGuardado.predeterminado: False}
            )
        metodo = MetodoPagoGuardado(
            id_cliente=id_cliente,
            alias=alias,
            tipo=tipo,
            ultimos4=ultimos4,
            clave_hash=clave_hash,
            predeterminado=predeterminado,
        )
        db.add(metodo)
        db.commit()
        db.refresh(metodo)
        return metodo

    @staticmethod
    def update(
        db: Session,
        id_cliente: int,
        id_metodo_guardado: int,
        alias: str | None = None,
        tipo: str | None = None,
        ultimos4=None,
        clave_hash: str | None = None,
        predeterminado: bool | None = None,
    ) -> MetodoPagoGuardado | None:
        metodo = MetodoPagoGuardadoRepository.get_by_id(db, id_cliente, id_metodo_guardado)
        if not metodo:
            return None
        if alias is not None:
            metodo.alias = alias
        if tipo is not None:
            metodo.tipo = tipo
        if ultimos4 is not None:
            metodo.ultimos4 = ultimos4
        if clave_hash is not None:
            metodo.clave_hash = clave_hash
        if predeterminado is not None:
            if predeterminado:
                # Al marcar uno como predeterminado, el resto deja de serlo.
                db.query(MetodoPagoGuardado).filter(
                    MetodoPagoGuardado.id_cliente == id_cliente,
                    MetodoPagoGuardado.id_metodo_guardado != id_metodo_guardado,
                ).update({MetodoPagoGuardado.predeterminado: False})
            metodo.predeterminado = predeterminado
        db.commit()
        db.refresh(metodo)
        return metodo

    @staticmethod
    def delete(db: Session, id_cliente: int, id_metodo_guardado: int) -> bool:
        metodo = MetodoPagoGuardadoRepository.get_by_id(db, id_cliente, id_metodo_guardado)
        if not metodo:
            return False
        db.delete(metodo)
        db.commit()
        return True
