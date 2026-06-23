from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.fidelidad import TipoMovimientoFidelidad

_TIPOS_PERMITEN_NEGATIVOS = {
    TipoMovimientoFidelidad.REVERSA,
    TipoMovimientoFidelidad.AJUSTE_ADMIN,
}


class AcreditarPedidoRequest(BaseModel):
    """Payload para el endpoint POST /fidelidad/acreditar."""

    usuario_id: UUID
    pedido_id: UUID
    total_pedido: Decimal = Field(ge=0)
    descripcion: str | None = None


class MovimientoFidelidadCreate(BaseModel):
    """Schema para crear movimientos manuales (AJUSTE_ADMIN, CANJE, REVERSA)."""

    usuario_id: UUID
    pedido_id: UUID | None = None
    tipo_movimiento: TipoMovimientoFidelidad
    puntos: int
    sellos: int
    descripcion: str | None = None

    @model_validator(mode="after")
    def validate_reglas_negocio(self) -> "MovimientoFidelidadCreate":
        if self.tipo_movimiento not in _TIPOS_PERMITEN_NEGATIVOS:
            if self.puntos < 0:
                raise ValueError(
                    "puntos no puede ser negativo para este tipo de movimiento"
                )
            if self.sellos < 0:
                raise ValueError(
                    "sellos no puede ser negativo para este tipo de movimiento"
                )
        if (
            self.tipo_movimiento == TipoMovimientoFidelidad.ACREDITACION_PEDIDO
            and self.pedido_id is None
        ):
            raise ValueError("pedido_id es obligatorio para ACREDITACION_PEDIDO")
        return self


class MovimientoFidelidadRead(BaseModel):
    id: UUID
    usuario_id: UUID
    pedido_id: UUID | None
    tipo_movimiento: TipoMovimientoFidelidad
    puntos: int
    sellos: int
    descripcion: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ResumenFidelidad(BaseModel):
    usuario_id: UUID
    puntos: int
    sellos: int
    movimientos: list[MovimientoFidelidadRead]
