import enum
import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class TipoMovimientoFidelidad(str, enum.Enum):
    ACREDITACION_PEDIDO = "ACREDITACION_PEDIDO"
    AJUSTE_ADMIN = "AJUSTE_ADMIN"
    CANJE = "CANJE"
    REVERSA = "REVERSA"


class TipoReglaFidelidad(str, enum.Enum):
    PRINCIPAL = "PRINCIPAL"
    PRODUCTO = "PRODUCTO"
    PROMOCION = "PROMOCION"


class FidelidadMovimiento(Base):
    __tablename__ = "fidelidad_movimientos"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    usuario_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("usuarios.id"), nullable=False, index=True
    )
    pedido_id: Mapped[uuid.UUID | None] = mapped_column(nullable=True, index=True)
    tipo_movimiento: Mapped[TipoMovimientoFidelidad] = mapped_column(
        Enum(TipoMovimientoFidelidad), nullable=False
    )
    puntos: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    sellos: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    descripcion: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class FidelidadRegla(Base):
    __tablename__ = "fidelidad_reglas"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    nombre: Mapped[str] = mapped_column(String, nullable=False)
    tipo: Mapped[TipoReglaFidelidad] = mapped_column(
        Enum(TipoReglaFidelidad), nullable=False, default=TipoReglaFidelidad.PRINCIPAL
    )
    puntos_por_sol: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False, default=1)
    sellos_por_pedido: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    puntos_canje_cafe: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    sellos_canje_cafe: Mapped[int] = mapped_column(Integer, nullable=False, default=10)
    producto_criterio_id: Mapped[uuid.UUID | None] = mapped_column(nullable=True)
    cantidad_criterio: Mapped[int | None] = mapped_column(Integer, nullable=True)
    producto_premio_id: Mapped[uuid.UUID | None] = mapped_column(nullable=True)
    activo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
