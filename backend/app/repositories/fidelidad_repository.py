from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.fidelidad import FidelidadMovimiento, FidelidadRegla, TipoMovimientoFidelidad
from app.models.usuario import Usuario, UsuarioRol


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

    def get_ranking(self) -> list[tuple[Usuario, int, int]]:
        puntos_total = func.coalesce(func.sum(FidelidadMovimiento.puntos), 0).label("puntos")
        sellos_total = func.coalesce(func.sum(FidelidadMovimiento.sellos), 0).label("sellos")
        result = self.db.execute(
            select(Usuario, puntos_total, sellos_total)
            .outerjoin(FidelidadMovimiento, FidelidadMovimiento.usuario_id == Usuario.id)
            .where(Usuario.rol == UsuarioRol.ESTUDIANTE, Usuario.activo.is_(True))
            .group_by(Usuario.id)
            .order_by(puntos_total.desc(), sellos_total.desc(), Usuario.nombre.asc())
        )
        return [(row[0], int(row[1] or 0), int(row[2] or 0)) for row in result.all()]

    def list_reglas(self) -> list[FidelidadRegla]:
        result = self.db.execute(
            select(FidelidadRegla).order_by(FidelidadRegla.activo.desc(), FidelidadRegla.created_at.desc())
        )
        return list(result.scalars().all())

    def get_regla_by_id(self, regla_id: UUID) -> FidelidadRegla | None:
        return self.db.get(FidelidadRegla, regla_id)

    def get_regla_activa_principal(self) -> FidelidadRegla | None:
        result = self.db.execute(
            select(FidelidadRegla)
            .where(FidelidadRegla.activo.is_(True))
            .order_by(FidelidadRegla.created_at.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    def create_regla(self, **values) -> FidelidadRegla:
        regla = FidelidadRegla(**values)
        self.db.add(regla)
        self.db.commit()
        self.db.refresh(regla)
        return regla

    def update_regla(self, regla: FidelidadRegla, values: dict) -> FidelidadRegla:
        for key, value in values.items():
            setattr(regla, key, value)
        self.db.commit()
        self.db.refresh(regla)
        return regla

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
