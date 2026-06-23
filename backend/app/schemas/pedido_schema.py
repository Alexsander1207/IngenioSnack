from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.pedido import PedidoEstado


class PedidoItemCreate(BaseModel):
    producto_id: UUID
    promocion_id: UUID | None = None
    cantidad: int = Field(gt=0)


class PedidoCreate(BaseModel):
    items: list[PedidoItemCreate] = Field(min_length=1)


class ItemPedidoRead(BaseModel):
    id: UUID
    pedido_id: UUID
    producto_id: UUID | None
    promocion_id: UUID | None
    nombre_producto: str
    precio_unitario: Decimal
    cantidad: int
    subtotal: Decimal

    model_config = ConfigDict(from_attributes=True)


class PedidoRead(BaseModel):
    id: UUID
    codigo: str
    usuario_id: UUID
    estado: PedidoEstado
    subtotal: Decimal
    descuento: Decimal
    total: Decimal
    fidelidad_acreditada: bool
    created_at: datetime
    updated_at: datetime
    items: list[ItemPedidoRead] = []

    model_config = ConfigDict(from_attributes=True)


class PedidoEstadoUpdate(BaseModel):
    estado: PedidoEstado
