from __future__ import annotations

import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import Protocol
from uuid import UUID

from fastapi import HTTPException, status

from app.models.pedido import ItemPedido, Pedido, PedidoEstado
from app.models.producto import Producto
from app.repositories.pedido_repository import PedidoRepository
from app.repositories.producto_repository import ProductoRepository
from app.schemas.pedido_schema import PedidoCreate


class FidelidadServicePort(Protocol):
    def acreditar_por_pedido(self, pedido: Pedido) -> None:
        ...


def generar_codigo_pedido() -> str:
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    suffix = uuid.uuid4().hex[:8].upper()
    return f"PED-{timestamp}-{suffix}"


class PedidoService:
    def __init__(
        self,
        pedido_repository: PedidoRepository,
        producto_repository: ProductoRepository | None = None,
        fidelidad_service: FidelidadServicePort | None = None,
    ) -> None:
        self.pedido_repository = pedido_repository
        self.producto_repository = producto_repository
        self.fidelidad_service = fidelidad_service

    def crear_pedido(self, usuario_id: UUID, payload: PedidoCreate) -> Pedido:
        if not payload.items:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="El pedido debe tener al menos un item.",
            )

        try:
            subtotal = Decimal("0")
            items: list[ItemPedido] = []
            productos_para_stock: list[tuple[Producto, int]] = []

            for item in payload.items:
                if item.cantidad <= 0:
                    raise HTTPException(
                        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                        detail="La cantidad debe ser mayor a 0.",
                    )

                producto = self._obtener_producto(item.producto_id)
                precio_unitario = Decimal(str(producto.precio))
                item_subtotal = precio_unitario * Decimal(item.cantidad)
                subtotal += item_subtotal

                if producto.stock < item.cantidad:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail=f"Stock insuficiente para {producto.nombre}.",
                    )

                productos_para_stock.append((producto, item.cantidad))
                items.append(
                    ItemPedido(
                        producto_id=producto.id,
                        promocion_id=item.promocion_id,
                        nombre_producto=producto.nombre,
                        precio_unitario=precio_unitario,
                        cantidad=item.cantidad,
                        subtotal=item_subtotal,
                    )
                )

            descuento = Decimal("0")
            total = subtotal - descuento
            pedido = Pedido(
                codigo=generar_codigo_pedido(),
                usuario_id=usuario_id,
                estado=PedidoEstado.PENDIENTE,
                subtotal=subtotal,
                descuento=descuento,
                total=total,
            )
            self.pedido_repository.add(pedido, items)
            self._descontar_stock(productos_para_stock)
            self._registrar_movimientos_stock(pedido, productos_para_stock)
            self.pedido_repository.commit()
            return self.pedido_repository.refresh(pedido)
        except Exception:
            self.pedido_repository.rollback()
            raise

    def listar_mis_pedidos(self, usuario_id: UUID) -> list[Pedido]:
        return self.pedido_repository.list_by_usuario(usuario_id)

    def listar_admin(self) -> list[Pedido]:
        return self.pedido_repository.list_all()

    def obtener_pedido(self, pedido_id: UUID, usuario_id: UUID | None = None, is_admin: bool = False) -> Pedido:
        pedido = self.pedido_repository.get(pedido_id)
        if not pedido:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pedido no encontrado.")
        if not is_admin and usuario_id and pedido.usuario_id != usuario_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No puedes ver este pedido.")
        return pedido

    def cambiar_estado(self, pedido_id: UUID, nuevo_estado: PedidoEstado) -> Pedido:
        pedido = self.obtener_pedido(pedido_id, is_admin=True)
        if nuevo_estado not in PedidoEstado:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Estado invalido.")

        try:
            estado_anterior = pedido.estado
            self.pedido_repository.set_estado(pedido, nuevo_estado)

            if (
                nuevo_estado == PedidoEstado.RECOGIDO
                and estado_anterior != PedidoEstado.RECOGIDO
                and not pedido.fidelidad_acreditada
            ):
                self._acreditar_fidelidad(pedido)
                self.pedido_repository.mark_fidelidad_acreditada(pedido)

            self.pedido_repository.commit()
            return self.pedido_repository.refresh(pedido)
        except Exception:
            self.pedido_repository.rollback()
            raise

    def _obtener_producto(self, producto_id: UUID) -> Producto:
        if not self.producto_repository:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Repositorio de productos no disponible.",
            )
        producto = self.producto_repository.get(producto_id)
        if not producto or not getattr(producto, "activo", True):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado.")
        return producto

    def _descontar_stock(self, productos: list[tuple[Producto, int]]) -> None:
        for producto, cantidad in productos:
            producto.stock -= cantidad

    def _registrar_movimientos_stock(self, pedido: Pedido, productos: list[tuple[Producto, int]]) -> None:
        # Integracion defensiva para Fase 6: el descuento queda en la misma transaccion.
        # Si StockRepository evoluciona, este hook debe registrar movimientos formales por pedido.
        _ = pedido
        _ = productos

    def _acreditar_fidelidad(self, pedido: Pedido) -> None:
        if self.fidelidad_service:
            self.fidelidad_service.acreditar_por_pedido(pedido)
        # TODO Fase 8: integrar servicio real de fidelidad.
        # El flag fidelidad_acreditada evita doble acreditacion cuando se conecte.
