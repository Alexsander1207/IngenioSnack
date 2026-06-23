from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.producto import Producto
from app.models.stock import StockMovimiento, TipoMovimiento


class StockRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_movimientos(self) -> list[StockMovimiento]:
        result = self.db.execute(
            select(StockMovimiento).order_by(StockMovimiento.created_at.desc())
        )
        return list(result.scalars().all())

    def list_movimientos_por_producto(self, producto_id: UUID) -> list[StockMovimiento]:
        result = self.db.execute(
            select(StockMovimiento)
            .where(StockMovimiento.producto_id == producto_id)
            .order_by(StockMovimiento.created_at.desc())
        )
        return list(result.scalars().all())

    def create_movimiento(
        self,
        producto: Producto,
        tipo_movimiento: TipoMovimiento,
        cantidad: int,
        stock_anterior: int,
        stock_nuevo: int,
        pedido_id: UUID | None,
        motivo: str | None,
    ) -> StockMovimiento:
        movimiento = StockMovimiento(
            producto_id=producto.id,
            pedido_id=pedido_id,
            tipo_movimiento=tipo_movimiento,
            cantidad=cantidad,
            stock_anterior=stock_anterior,
            stock_nuevo=stock_nuevo,
            motivo=motivo,
        )
        producto.stock = stock_nuevo
        self.db.add(movimiento)
        self.db.commit()
        self.db.refresh(movimiento)
        return movimiento
