import math
from decimal import Decimal
from uuid import UUID

from app.models.fidelidad import FidelidadMovimiento, TipoMovimientoFidelidad
from app.repositories.fidelidad_repository import FidelidadRepository
from app.schemas.fidelidad_schema import MovimientoFidelidadCreate, ResumenFidelidad


class FidelidadService:
    def __init__(self, repo: FidelidadRepository) -> None:
        self.repo = repo

    def get_resumen(self, usuario_id: UUID) -> ResumenFidelidad:
        movimientos = self.repo.get_movimientos_by_usuario(usuario_id)
        puntos = sum(m.puntos for m in movimientos)
        sellos = sum(m.sellos for m in movimientos)
        return ResumenFidelidad(
            usuario_id=usuario_id,
            puntos=puntos,
            sellos=sellos,
            movimientos=movimientos,
        )

    def get_movimientos(self, usuario_id: UUID) -> list[FidelidadMovimiento]:
        return self.repo.get_movimientos_by_usuario(usuario_id)

    def acreditar_por_pedido(
        self,
        usuario_id: UUID,
        pedido_id: UUID,
        total_pedido: Decimal,
        descripcion: str | None = None,
    ) -> FidelidadMovimiento:
        """
        Acredita puntos y un sello por un pedido recogido.

        Idempotente: si ya existe una ACREDITACION_PEDIDO para este pedido_id,
        retorna el movimiento existente sin crear duplicado.

        Integracion con FASE 7: pedido_service debe llamar a este metodo cuando
        el estado de un pedido cambia a RECOGIDO:
            fidelidad_service.acreditar_por_pedido(
                usuario_id=pedido.usuario_id,
                pedido_id=pedido.id,
                total_pedido=pedido.total,
            )
        """
        existing = self.repo.get_acreditacion_by_pedido(pedido_id)
        if existing:
            return existing

        puntos = math.floor(float(total_pedido))
        sellos = 1

        return self.repo.create_movimiento(
            usuario_id=usuario_id,
            pedido_id=pedido_id,
            tipo_movimiento=TipoMovimientoFidelidad.ACREDITACION_PEDIDO,
            puntos=puntos,
            sellos=sellos,
            descripcion=descripcion or f"Acreditacion por pedido {pedido_id}",
        )

    def crear_movimiento_admin(
        self, payload: MovimientoFidelidadCreate
    ) -> FidelidadMovimiento:
        return self.repo.create_movimiento(
            usuario_id=payload.usuario_id,
            pedido_id=payload.pedido_id,
            tipo_movimiento=payload.tipo_movimiento,
            puntos=payload.puntos,
            sellos=payload.sellos,
            descripcion=payload.descripcion,
        )
