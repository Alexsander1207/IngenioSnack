import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class TipoMovimientoFidelidad(str, enum.Enum):
    ACREDITACION_PEDIDO = "ACREDITACION_PEDIDO"
    AJUSTE_ADMIN = "AJUSTE_ADMIN"
    CANJE = "CANJE"
    REVERSA = "REVERSA"


class FidelidadMovimiento(Base):
    __tablename__ = "fidelidad_movimientos"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    usuario_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("usuarios.id"), nullable=False, index=True
    )
    # pedido_id sin FK -- pedidos aun no integrado en FastAPI
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
