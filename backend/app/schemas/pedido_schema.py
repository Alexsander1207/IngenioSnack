from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.pedido import PedidoEstado


class PedidoItemCreate(BaseModel):
    producto_id: UUID | None = None
    promocion_id: UUID | None = None
    cantidad: int = Field(gt=0)

    @model_validator(mode="after")
    def producto_o_promocion_requerido(self) -> "PedidoItemCreate":
        if not self.producto_id and not self.promocion_id:
            raise ValueError("Se requiere producto_id o promocion_id.")
        return self


class PedidoCreate(BaseModel):
    items: list[PedidoItemCreate] = Field(min_length=1)
    pickup_at: datetime | None = None


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
    nombre_usuario: str | None = None
    estado: PedidoEstado
    subtotal: Decimal
    descuento: Decimal
    total: Decimal
    fidelidad_acreditada: bool
    pickup_at: datetime | None = None
    stock_liberado: bool = False
    created_at: datetime
    updated_at: datetime
    items: list[ItemPedidoRead] = []

    model_config = ConfigDict(from_attributes=True)


class PedidoEstadoUpdate(BaseModel):
    estado: PedidoEstado
