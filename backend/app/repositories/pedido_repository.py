from uuid import UUID

from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.pedido import ItemPedido, Pedido, PedidoEstado
from app.models.stock import StockMovimiento, TipoMovimiento
from app.models.usuario import Usuario


class PedidoRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def _attach_nombres(self, pedidos: list[Pedido]) -> None:
        if not pedidos:
            return
        ids = {p.usuario_id for p in pedidos}
        rows = self.db.execute(
            select(Usuario.id, Usuario.nombre).where(Usuario.id.in_(ids))
        ).all()
        names = {row.id: row.nombre for row in rows}
        for p in pedidos:
            p.nombre_usuario = names.get(p.usuario_id)

    def list_by_usuario(self, usuario_id: UUID) -> list[Pedido]:
        result = self.db.execute(
            select(Pedido)
            .options(selectinload(Pedido.items))
            .where(Pedido.usuario_id == usuario_id)
            .order_by(Pedido.created_at.desc())
        )
        pedidos = list(result.scalars().all())
        self._attach_nombres(pedidos)
        return pedidos

    def list_all(self) -> list[Pedido]:
        result = self.db.execute(
            select(Pedido)
            .options(selectinload(Pedido.items))
            .order_by(Pedido.created_at.desc())
        )
        pedidos = list(result.scalars().all())
        self._attach_nombres(pedidos)
        return pedidos

    def get(self, pedido_id: UUID) -> Pedido | None:
        result = self.db.execute(
            select(Pedido)
            .options(selectinload(Pedido.items))
            .where(Pedido.id == pedido_id)
        )
        return result.scalar_one_or_none()

    def list_vencidos(self, limite: datetime) -> list[Pedido]:
        result = self.db.execute(
            select(Pedido)
            .options(selectinload(Pedido.items))
            .where(
                Pedido.pickup_at.is_not(None),
                Pedido.pickup_at < limite,
                Pedido.estado.in_([PedidoEstado.PENDIENTE, PedidoEstado.PREPARANDO, PedidoEstado.LISTO]),
            )
            .order_by(Pedido.pickup_at.asc())
        )
        pedidos = list(result.scalars().all())
        self._attach_nombres(pedidos)
        return pedidos

    def get_usuario(self, usuario_id: UUID) -> Usuario | None:
        return self.db.get(Usuario, usuario_id)

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

    def mark_stock_liberado(self, pedido: Pedido) -> Pedido:
        pedido.stock_liberado = True
        self.db.flush()
        return pedido

    def add_stock_movimiento(
        self,
        *,
        producto_id: UUID,
        pedido_id: UUID,
        tipo_movimiento: TipoMovimiento,
        cantidad: int,
        stock_anterior: int,
        stock_nuevo: int,
        motivo: str,
    ) -> StockMovimiento:
        movimiento = StockMovimiento(
            producto_id=producto_id,
            pedido_id=pedido_id,
            tipo_movimiento=tipo_movimiento,
            cantidad=cantidad,
            stock_anterior=stock_anterior,
            stock_nuevo=stock_nuevo,
            motivo=motivo,
        )
        self.db.add(movimiento)
        self.db.flush()
        return movimiento

    def commit(self) -> None:
        self.db.commit()

    def rollback(self) -> None:
        self.db.rollback()

    def refresh(self, pedido: Pedido) -> Pedido:
        self.db.refresh(pedido)
        return self.get(pedido.id) or pedido
