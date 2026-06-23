from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.stock import TipoMovimiento


class MovimientoCreate(BaseModel):
    producto_id: UUID
    pedido_id: UUID | None = None
    tipo_movimiento: TipoMovimiento
    cantidad: int = Field(gt=0)
    motivo: str | None = None


class MovimientoRead(BaseModel):
    id: UUID
    producto_id: UUID
    pedido_id: UUID | None
    tipo_movimiento: TipoMovimiento
    cantidad: int
    stock_anterior: int
    stock_nuevo: int = Field(ge=0)
    motivo: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class StockItem(BaseModel):
    """Current stock snapshot for a single product."""

    id: UUID
    nombre: str
    stock: int

    model_config = ConfigDict(from_attributes=True)
