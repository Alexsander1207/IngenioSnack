import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class TipoMovimiento(str, enum.Enum):
    ENTRADA = "ENTRADA"
    SALIDA = "SALIDA"
    AJUSTE = "AJUSTE"
    VENTA = "VENTA"
    CANCELACION = "CANCELACION"


class StockMovimiento(Base):
    __tablename__ = "stock_movimientos"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    producto_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("productos.id"), nullable=False, index=True
    )
    pedido_id: Mapped[uuid.UUID | None] = mapped_column(nullable=True)
    tipo_movimiento: Mapped[TipoMovimiento] = mapped_column(
        Enum(TipoMovimiento), nullable=False
    )
    cantidad: Mapped[int] = mapped_column(Integer, nullable=False)
    stock_anterior: Mapped[int] = mapped_column(Integer, nullable=False)
    stock_nuevo: Mapped[int] = mapped_column(Integer, nullable=False)
    motivo: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
