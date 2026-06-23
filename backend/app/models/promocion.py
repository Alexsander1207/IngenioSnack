import enum
import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import Boolean, DateTime, Enum, Integer, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class PromocionTipo(str, enum.Enum):
    DESCUENTO_PORCENTAJE = "DESCUENTO_PORCENTAJE"
    DESCUENTO_FIJO = "DESCUENTO_FIJO"
    COMBO = "COMBO"
    REGALO = "REGALO"


class Promocion(Base):
    __tablename__ = "promociones"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    nombre: Mapped[str] = mapped_column(String, nullable=False)
    descripcion: Mapped[str | None] = mapped_column(Text, nullable=True)
    tipo: Mapped[PromocionTipo] = mapped_column(Enum(PromocionTipo), nullable=False)
    valor: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    fecha_inicio: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    fecha_fin: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    imagen_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    puntos_requeridos: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    disponible: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
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
