from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.fidelidad import FidelidadMovimiento, TipoMovimientoFidelidad


class FidelidadRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_movimientos_by_usuario(self, usuario_id: UUID) -> list[FidelidadMovimiento]:
        result = self.db.execute(
            select(FidelidadMovimiento)
            .where(FidelidadMovimiento.usuario_id == usuario_id)
            .order_by(FidelidadMovimiento.created_at.desc())
        )
        return list(result.scalars().all())

    def get_acreditacion_by_pedido(self, pedido_id: UUID) -> FidelidadMovimiento | None:
        """Busca una acreditacion existente para el pedido (control de idempotencia)."""
        result = self.db.execute(
            select(FidelidadMovimiento).where(
                FidelidadMovimiento.pedido_id == pedido_id,
                FidelidadMovimiento.tipo_movimiento
                == TipoMovimientoFidelidad.ACREDITACION_PEDIDO,
            )
        )
        return result.scalar_one_or_none()

    def create_movimiento(
        self,
        usuario_id: UUID,
        pedido_id: UUID | None,
        tipo_movimiento: TipoMovimientoFidelidad,
        puntos: int,
        sellos: int,
        descripcion: str | None,
    ) -> FidelidadMovimiento:
        movimiento = FidelidadMovimiento(
            usuario_id=usuario_id,
            pedido_id=pedido_id,
            tipo_movimiento=tipo_movimiento,
            puntos=puntos,
            sellos=sellos,
            descripcion=descripcion,
        )
        self.db.add(movimiento)
        self.db.commit()
        self.db.refresh(movimiento)
        return movimiento
