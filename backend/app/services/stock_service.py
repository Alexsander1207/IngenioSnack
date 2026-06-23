from uuid import UUID

from fastapi import HTTPException, status

from app.models.producto import Producto
from app.models.stock import StockMovimiento, TipoMovimiento
from app.repositories.producto_repository import ProductoRepository
from app.repositories.stock_repository import StockRepository
from app.schemas.stock_schema import MovimientoCreate, StockAlertaRead

STOCK_BAJO_UMBRAL = 5

_TIPOS_SALIDA = {TipoMovimiento.SALIDA, TipoMovimiento.VENTA}
_TIPOS_ENTRADA = {TipoMovimiento.ENTRADA, TipoMovimiento.CANCELACION}


class StockService:
    def __init__(
        self,
        stock_repo: StockRepository,
        producto_repo: ProductoRepository,
    ) -> None:
        self.stock_repo = stock_repo
        self.producto_repo = producto_repo

    def list_stock(self) -> list[Producto]:
        return self.producto_repo.list()

    def list_movimientos(self) -> list[StockMovimiento]:
        return self.stock_repo.list_movimientos()

    def list_movimientos_por_producto(self, producto_id: UUID) -> list[StockMovimiento]:
        return self.stock_repo.list_movimientos_por_producto(producto_id)

    def list_alertas(self, umbral: int = STOCK_BAJO_UMBRAL) -> list[StockAlertaRead]:
        productos = [
            producto
            for producto in self.producto_repo.list()
            if getattr(producto, "activo", True) and getattr(producto, "stock", 0) <= umbral
        ]
        return [
            StockAlertaRead(
                producto_id=producto.id,
                producto=producto.nombre,
                stock_actual=producto.stock,
                categoria=getattr(producto, "categoria", None),
                umbral=umbral,
                recomendacion=f"Reponer al menos {max(umbral * 2 - producto.stock, umbral)} unidades.",
            )
            for producto in productos
        ]

    def crear_movimiento(self, payload: MovimientoCreate) -> StockMovimiento:
        producto = self.producto_repo.get(payload.producto_id)
        if not producto:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Producto no encontrado.",
            )

        stock_anterior = producto.stock

        if payload.tipo_movimiento in _TIPOS_SALIDA:
            stock_nuevo = stock_anterior - payload.cantidad
        elif payload.tipo_movimiento in _TIPOS_ENTRADA:
            stock_nuevo = stock_anterior + payload.cantidad
        else:
            stock_nuevo = payload.cantidad

        if stock_nuevo < 0:
            raise ValueError(
                f"El movimiento dejaria el stock en {stock_nuevo}. Stock insuficiente."
            )

        return self.stock_repo.create_movimiento(
            producto=producto,
            tipo_movimiento=payload.tipo_movimiento,
            cantidad=payload.cantidad,
            stock_anterior=stock_anterior,
            stock_nuevo=stock_nuevo,
            pedido_id=payload.pedido_id,
            motivo=payload.motivo,
        )
