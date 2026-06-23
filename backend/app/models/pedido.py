import enum
import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class PedidoEstado(str, enum.Enum):
    PENDIENTE = "PENDIENTE"
    PREPARANDO = "PREPARANDO"
    LISTO = "LISTO"
    RECOGIDO = "RECOGIDO"
    CANCELADO = "CANCELADO"


class Pedido(Base):
    __tablename__ = "pedidos"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    codigo: Mapped[str] = mapped_column(String, nullable=False, unique=True, index=True)
    usuario_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("usuarios.id"), nullable=False, index=True)
    estado: Mapped[PedidoEstado] = mapped_column(
        Enum(PedidoEstado),
        nullable=False,
        default=PedidoEstado.PENDIENTE,
    )
    subtotal: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    descuento: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    total: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    fidelidad_acreditada: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    items: Mapped[list["ItemPedido"]] = relationship(
        back_populates="pedido",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class ItemPedido(Base):
    __tablename__ = "items_pedido"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    pedido_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("pedidos.id"), nullable=False, index=True)
    producto_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("productos.id"), nullable=True)
    promocion_id: Mapped[uuid.UUID | None] = mapped_column(nullable=True)
    nombre_producto: Mapped[str] = mapped_column(String, nullable=False)
    precio_unitario: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    cantidad: Mapped[int] = mapped_column(nullable=False)
    subtotal: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)

    pedido: Mapped[Pedido] = relationship(back_populates="items")
