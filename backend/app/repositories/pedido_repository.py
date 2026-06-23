from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.pedido import ItemPedido, Pedido, PedidoEstado


class PedidoRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_by_usuario(self, usuario_id: UUID) -> list[Pedido]:
        result = self.db.execute(
            select(Pedido)
            .options(selectinload(Pedido.items))
            .where(Pedido.usuario_id == usuario_id)
            .order_by(Pedido.created_at.desc())
        )
        return list(result.scalars().all())

    def list_all(self) -> list[Pedido]:
        result = self.db.execute(
            select(Pedido)
            .options(selectinload(Pedido.items))
            .order_by(Pedido.created_at.desc())
        )
        return list(result.scalars().all())

    def get(self, pedido_id: UUID) -> Pedido | None:
        result = self.db.execute(
            select(Pedido)
            .options(selectinload(Pedido.items))
            .where(Pedido.id == pedido_id)
        )
        return result.scalar_one_or_none()

    def add(self, pedido: Pedido, items: list[ItemPedido]) -> Pedido:
        pedido.items = items
        self.db.add(pedido)
        self.db.flush()
        return pedido

    def set_estado(self, pedido: Pedido, estado: PedidoEstado) -> Pedido:
        pedido.estado = estado
        self.db.flush()
        return pedido

    def mark_fidelidad_acreditada(self, pedido: Pedido) -> Pedido:
        pedido.fidelidad_acreditada = True
        self.db.flush()
        return pedido

    def commit(self) -> None:
        self.db.commit()

    def rollback(self) -> None:
        self.db.rollback()

    def refresh(self, pedido: Pedido) -> Pedido:
        self.db.refresh(pedido)
        return self.get(pedido.id) or pedido
