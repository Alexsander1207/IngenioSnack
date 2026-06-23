from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import Protocol
from uuid import UUID

from fastapi import HTTPException, status

from app.models.pedido import ItemPedido, Pedido, PedidoEstado
from app.models.producto import Producto
from app.models.stock import TipoMovimiento
from app.repositories.pedido_repository import PedidoRepository
from app.repositories.producto_repository import ProductoRepository
from app.schemas.pedido_schema import PedidoCreate

PENALIDAD_NO_RECOGIDO = 20
BAN_DIAS_CONDUCTA_CRITICA = 1
TOLERANCIA_RECOJO_MINUTOS = 20


class FidelidadServicePort(Protocol):
    def acreditar_por_pedido(
        self,
        usuario_id: UUID,
        pedido_id: UUID,
        total_pedido: Decimal,
        descripcion: str | None = None,
    ) -> None: ...

    def deducir_puntos_promo(
        self,
        usuario_id: UUID,
        pedido_id: UUID,
        puntos: int,
        descripcion: str | None = None,
    ) -> None: ...

    def devolver_puntos_promo(self, pedido_id: UUID) -> int: ...


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
        promocion_repository=None,
    ) -> None:
        self.pedido_repository = pedido_repository
        self.producto_repository = producto_repository
        self.fidelidad_service = fidelidad_service
        self.promocion_repository = promocion_repository

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
            total_puntos_a_deducir = 0

            for item in payload.items:
                if item.cantidad <= 0:
                    raise HTTPException(
                        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                        detail="La cantidad debe ser mayor a 0.",
                    )

                if item.producto_id:
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
                else:
                    promo = self._obtener_promocion_vigente(item.promocion_id)
                    precio_unitario = Decimal(str(promo.valor))
                    item_subtotal = precio_unitario * Decimal(item.cantidad)
                    subtotal += item_subtotal
                    puntos_req = getattr(promo, "puntos_requeridos", 0) or 0
                    total_puntos_a_deducir += puntos_req * item.cantidad
                    items.append(
                        ItemPedido(
                            producto_id=None,
                            promocion_id=promo.id,
                            nombre_producto=promo.nombre,
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
                pickup_at=getattr(payload, "pickup_at", None),
            )
            self.pedido_repository.add(pedido, items)
            self._descontar_stock(productos_para_stock)
            self._registrar_movimientos_stock(pedido, productos_para_stock)

            if total_puntos_a_deducir > 0:
                if not self.fidelidad_service:
                    raise HTTPException(
                        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                        detail="Servicio de fidelidad no disponible para esta operacion.",
                    )
                self.fidelidad_service.deducir_puntos_promo(
                    usuario_id=usuario_id,
                    pedido_id=pedido.id,
                    puntos=total_puntos_a_deducir,
                    descripcion=f"Canje de {total_puntos_a_deducir} pts por promocion(es)",
                )

            self.pedido_repository.commit()
            return self.pedido_repository.refresh(pedido)
        except Exception:
            self.pedido_repository.rollback()
            raise

    def listar_mis_pedidos(self, usuario_id: UUID) -> list[Pedido]:
        return self.pedido_repository.list_by_usuario(usuario_id)

    def listar_admin(self) -> list[Pedido]:
        return self.pedido_repository.list_all()

    def listar_vencidos(self, tolerancia_minutos: int = TOLERANCIA_RECOJO_MINUTOS) -> list[Pedido]:
        limite = datetime.now(timezone.utc) - timedelta(minutes=tolerancia_minutos)
        return self.pedido_repository.list_vencidos(limite)

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
            if estado_anterior == PedidoEstado.RECOGIDO and nuevo_estado == PedidoEstado.NO_RECOGIDO:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Un pedido recogido no puede marcarse como no recogido.",
                )
            self.pedido_repository.set_estado(pedido, nuevo_estado)

            if (
                nuevo_estado == PedidoEstado.RECOGIDO
                and estado_anterior != PedidoEstado.RECOGIDO
                and not pedido.fidelidad_acreditada
            ):
                self._acreditar_fidelidad(pedido)
                self.pedido_repository.mark_fidelidad_acreditada(pedido)

            if nuevo_estado == PedidoEstado.NO_RECOGIDO and estado_anterior != PedidoEstado.NO_RECOGIDO:
                self._penalizar_no_recogido(pedido)
                self._liberar_stock_no_recogido(pedido)

            if nuevo_estado == PedidoEstado.CANCELADO:
                self._devolver_puntos_promo(pedido)

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

    def _obtener_promocion_vigente(self, promocion_id: UUID):
        if not self.promocion_repository:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Repositorio de promociones no disponible.",
            )
        promo = self.promocion_repository.get(promocion_id)
        if not promo or not getattr(promo, "activo", True):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Promocion no encontrada.")
        if not getattr(promo, "disponible", True):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="La promocion no esta disponible.",
            )
        now = datetime.now(timezone.utc)
        fecha_inicio = promo.fecha_inicio
        fecha_fin = promo.fecha_fin
        if hasattr(fecha_inicio, "tzinfo") and fecha_inicio.tzinfo is None:
            fecha_inicio = fecha_inicio.replace(tzinfo=timezone.utc)
        if hasattr(fecha_fin, "tzinfo") and fecha_fin.tzinfo is None:
            fecha_fin = fecha_fin.replace(tzinfo=timezone.utc)
        if now < fecha_inicio or now > fecha_fin:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="La promocion no esta vigente.",
            )
        return promo

    def _descontar_stock(self, productos: list[tuple[Producto, int]]) -> None:
        for producto, cantidad in productos:
            producto.stock -= cantidad

    def _registrar_movimientos_stock(self, pedido: Pedido, productos: list[tuple[Producto, int]]) -> None:
        for producto, cantidad in productos:
            self.pedido_repository.add_stock_movimiento(
                producto_id=producto.id,
                pedido_id=pedido.id,
                tipo_movimiento=TipoMovimiento.VENTA,
                cantidad=cantidad,
                stock_anterior=producto.stock + cantidad,
                stock_nuevo=producto.stock,
                motivo="Reserva de stock por pedido",
            )

    def _penalizar_no_recogido(self, pedido: Pedido) -> None:
        usuario = self.pedido_repository.get_usuario(pedido.usuario_id)
        if not usuario:
            return

        usuario.conducta_score = max(0, int(getattr(usuario, "conducta_score", 100)) - PENALIDAD_NO_RECOGIDO)
        if usuario.conducta_score < 50:
            usuario.banned_until = datetime.now(timezone.utc) + timedelta(days=BAN_DIAS_CONDUCTA_CRITICA)
            usuario.ban_reason = "Penalidad por pedido no recogido."

    def _liberar_stock_no_recogido(self, pedido: Pedido) -> None:
        if pedido.stock_liberado:
            return

        for item in pedido.items:
            if not item.producto_id:
                continue
            producto = self._obtener_producto(item.producto_id)
            stock_anterior = producto.stock
            producto.stock += item.cantidad
            self.pedido_repository.add_stock_movimiento(
                producto_id=producto.id,
                pedido_id=pedido.id,
                tipo_movimiento=TipoMovimiento.CANCELACION,
                cantidad=item.cantidad,
                stock_anterior=stock_anterior,
                stock_nuevo=producto.stock,
                motivo="Liberacion por pedido no recogido",
            )
        self.pedido_repository.mark_stock_liberado(pedido)

    def _acreditar_fidelidad(self, pedido: Pedido) -> None:
        if self.fidelidad_service:
            self.fidelidad_service.acreditar_por_pedido(
                usuario_id=pedido.usuario_id,
                pedido_id=pedido.id,
                total_pedido=pedido.total,
                descripcion=f"Acreditacion por pedido {pedido.codigo}",
            )

    def _devolver_puntos_promo(self, pedido: Pedido) -> None:
        if self.fidelidad_service:
            self.fidelidad_service.devolver_puntos_promo(pedido.id)
