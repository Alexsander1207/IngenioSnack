import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import Boolean, DateTime, ForeignKey, Numeric, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Producto(Base):
    __tablename__ = "productos"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    nombre: Mapped[str] = mapped_column(String, nullable=False)
    descripcion: Mapped[str | None] = mapped_column(Text, nullable=True)
    precio: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    stock: Mapped[int] = mapped_column(nullable=False, default=0)
    categoria: Mapped[str | None] = mapped_column(String, nullable=True)
    categoria_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("categorias.id"), nullable=True)
    imagen_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    disponible: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    activo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    calorias: Mapped[int | None] = mapped_column(nullable=True)
    proteinas: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    carbohidratos: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    grasas: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    alergenos: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class FavoritoProducto(Base):
    __tablename__ = "favoritos_productos"
    __table_args__ = (
        UniqueConstraint("usuario_id", "producto_id", name="uq_favoritos_productos_usuario_producto"),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    usuario_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False, index=True)
    producto_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("productos.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    producto: Mapped[Producto] = relationship("Producto")
