from __future__ import annotations

from datetime import date as date_type, datetime
from decimal import Decimal

from sqlalchemy import distinct, func, select
from sqlalchemy.orm import Session

from app.models.fidelidad import FidelidadMovimiento
from app.models.pedido import ItemPedido, Pedido, PedidoEstado
from app.models.producto import Producto
from app.models.usuario import Usuario, UsuarioRol
from app.schemas.reporte_schema import (
    FidelidadData,
    MovimientoFidelidadResumen,
    ProductoStockBajoItem,
    ProductoVendidoItem,
    ProductosData,
    ResumenData,
    VentaPorDia,
    VentaPorEstado,
    VentasData,
)

STOCK_BAJO_UMBRAL = 5
MOVIMIENTOS_RECIENTES_LIMIT = 10


def _dec(value: object) -> Decimal:
    return Decimal(str(value)) if value is not None else Decimal("0")


def _int(value: object) -> int:
    return int(value) if value is not None else 0


class ReporteRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_resumen(self) -> ResumenData:
        total_pedidos = _int(self.db.execute(select(func.count(Pedido.id))).scalar())
        ventas_totales = _dec(self.db.execute(select(func.sum(Pedido.total))).scalar())
        pedidos_pendientes = _int(
            self.db.execute(
                select(func.count(Pedido.id)).where(Pedido.estado == PedidoEstado.PENDIENTE)
            ).scalar()
        )
        pedidos_recogidos = _int(
            self.db.execute(
                select(func.count(Pedido.id)).where(Pedido.estado == PedidoEstado.RECOGIDO)
            ).scalar()
        )
        productos_activos = _int(
            self.db.execute(
                select(func.count(Producto.id)).where(Producto.activo == True)  # noqa: E712
            ).scalar()
        )
        stock_bajo = _int(
            self.db.execute(
                select(func.count(Producto.id)).where(
                    Producto.activo == True,  # noqa: E712
                    Producto.stock < STOCK_BAJO_UMBRAL,
                )
            ).scalar()
        )
        puntos_emitidos = _int(
            self.db.execute(
                select(func.sum(FidelidadMovimiento.puntos)).where(
                    FidelidadMovimiento.puntos > 0
                )
            ).scalar()
        )
        sellos_emitidos = _int(
            self.db.execute(
                select(func.sum(FidelidadMovimiento.sellos)).where(
                    FidelidadMovimiento.sellos > 0
                )
            ).scalar()
        )
        estudiantes_registrados = _int(
            self.db.execute(
                select(func.count(Usuario.id)).where(
                    Usuario.rol == UsuarioRol.ESTUDIANTE,
                    Usuario.activo == True,  # noqa: E712
                )
            ).scalar()
        )
        return ResumenData(
            total_pedidos=total_pedidos,
            ventas_totales=ventas_totales,
            pedidos_pendientes=pedidos_pendientes,
            pedidos_recogidos=pedidos_recogidos,
            productos_activos=productos_activos,
            stock_bajo=stock_bajo,
            puntos_emitidos=puntos_emitidos,
            sellos_emitidos=sellos_emitidos,
            estudiantes_registrados=estudiantes_registrados,
        )

    def get_ventas(
        self,
        fecha_inicio: datetime | None,
        fecha_fin: datetime | None,
        estado: PedidoEstado | None,
    ) -> VentasData:
        def _apply(stmt):
            if fecha_inicio:
                stmt = stmt.where(Pedido.created_at >= fecha_inicio)
            if fecha_fin:
                stmt = stmt.where(Pedido.created_at <= fecha_fin)
            if estado:
                stmt = stmt.where(Pedido.estado == estado)
            return stmt

        agg = self.db.execute(
            _apply(
                select(
                    func.count(Pedido.id).label("cantidad"),
                    func.sum(Pedido.total).label("total"),
                )
            )
        ).one()
        cantidad_pedidos = _int(agg.cantidad)
        total_ventas = _dec(agg.total)
        ticket_promedio = (
            (total_ventas / Decimal(cantidad_pedidos)).quantize(Decimal("0.01"))
            if cantidad_pedidos > 0
            else Decimal("0")
        )

        estado_rows = self.db.execute(
            _apply(
                select(
                    Pedido.estado,
                    func.count(Pedido.id).label("cantidad"),
                    func.sum(Pedido.total).label("total"),
                ).group_by(Pedido.estado)
            )
        ).all()
        ventas_por_estado = [
            VentaPorEstado(
                estado=r.estado.value if hasattr(r.estado, "value") else str(r.estado),
                total=_dec(r.total),
                cantidad=_int(r.cantidad),
            )
            for r in estado_rows
        ]

        dia_rows = self.db.execute(
            _apply(
                select(
                    func.date(Pedido.created_at).label("fecha"),
                    func.count(Pedido.id).label("cantidad"),
                    func.sum(Pedido.total).label("total"),
                )
                .group_by(func.date(Pedido.created_at))
                .order_by(func.date(Pedido.created_at))
            )
        ).all()
        ventas_por_dia = [
            VentaPorDia(
                fecha=(
                    date_type.fromisoformat(str(r.fecha))
                    if isinstance(r.fecha, str)
                    else r.fecha
                ),
                total=_dec(r.total),
                cantidad=_int(r.cantidad),
            )
            for r in dia_rows
        ]

        return VentasData(
            total_ventas=total_ventas,
            cantidad_pedidos=cantidad_pedidos,
            ticket_promedio=ticket_promedio,
            ventas_por_estado=ventas_por_estado,
            ventas_por_dia=ventas_por_dia,
        )

    def get_productos(self) -> ProductosData:
        mas_vendidos_rows = self.db.execute(
            select(
                ItemPedido.producto_id,
                func.max(ItemPedido.nombre_producto).label("nombre"),
                func.max(Producto.categoria).label("categoria"),
                func.sum(ItemPedido.cantidad).label("cantidad_vendida"),
                func.sum(ItemPedido.subtotal).label("total"),
            )
            .join(Producto, ItemPedido.producto_id == Producto.id, isouter=True)
            .where(ItemPedido.producto_id.isnot(None))
            .group_by(ItemPedido.producto_id)
            .order_by(func.sum(ItemPedido.cantidad).desc())
            .limit(10)
        ).all()
        productos_mas_vendidos = [
            ProductoVendidoItem(
                producto_id=r.producto_id,
                nombre=r.nombre or "",
                cantidad_vendida=_int(r.cantidad_vendida),
                total=_dec(r.total),
                categoria=r.categoria,
            )
            for r in mas_vendidos_rows
        ]

        stock_bajo_rows = self.db.execute(
            select(Producto)
            .where(
                Producto.activo == True,  # noqa: E712
                Producto.stock < STOCK_BAJO_UMBRAL,
            )
            .order_by(Producto.stock)
        ).scalars().all()
        productos_con_stock_bajo = [
            ProductoStockBajoItem(producto_id=p.id, nombre=p.nombre, stock=p.stock)
            for p in stock_bajo_rows
        ]

        productos_activos = _int(
            self.db.execute(
                select(func.count(Producto.id)).where(Producto.activo == True)  # noqa: E712
            ).scalar()
        )
        productos_inactivos = _int(
            self.db.execute(
                select(func.count(Producto.id)).where(Producto.activo == False)  # noqa: E712
            ).scalar()
        )

        return ProductosData(
            productos_mas_vendidos=productos_mas_vendidos,
            productos_con_stock_bajo=productos_con_stock_bajo,
            productos_activos=productos_activos,
            productos_inactivos=productos_inactivos,
        )

    def get_fidelidad(self) -> FidelidadData:
        puntos_emitidos = _int(
            self.db.execute(
                select(func.sum(FidelidadMovimiento.puntos)).where(
                    FidelidadMovimiento.puntos > 0
                )
            ).scalar()
        )
        sellos_emitidos = _int(
            self.db.execute(
                select(func.sum(FidelidadMovimiento.sellos)).where(
                    FidelidadMovimiento.sellos > 0
                )
            ).scalar()
        )
        usuarios_con_fidelidad = _int(
            self.db.execute(
                select(func.count(distinct(FidelidadMovimiento.usuario_id)))
            ).scalar()
        )
        movimientos_rows = self.db.execute(
            select(FidelidadMovimiento)
            .order_by(FidelidadMovimiento.created_at.desc())
            .limit(MOVIMIENTOS_RECIENTES_LIMIT)
        ).scalars().all()
        movimientos_recientes = [
            MovimientoFidelidadResumen(
                id=m.id,
                usuario_id=m.usuario_id,
                tipo_movimiento=(
                    m.tipo_movimiento.value
                    if hasattr(m.tipo_movimiento, "value")
                    else str(m.tipo_movimiento)
                ),
                puntos=m.puntos,
                sellos=m.sellos,
                created_at=m.created_at,
            )
            for m in movimientos_rows
        ]

        return FidelidadData(
            puntos_emitidos=puntos_emitidos,
            sellos_emitidos=sellos_emitidos,
            usuarios_con_fidelidad=usuarios_con_fidelidad,
            movimientos_recientes=movimientos_recientes,
        )
