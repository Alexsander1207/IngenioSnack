from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, AliasChoices, model_validator

from app.models.fidelidad import TipoMovimientoFidelidad, TipoReglaFidelidad

_TIPOS_PERMITEN_NEGATIVOS = {
    TipoMovimientoFidelidad.REVERSA,
    TipoMovimientoFidelidad.AJUSTE_ADMIN,
    TipoMovimientoFidelidad.CANJE,
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


class PremioDinamicoRead(BaseModel):
    id: UUID
    reglaNombre: str
    cantidadAcumulada: int
    cantidadCriterio: int
    premiosDisponibles: int
    productoPremio: str | None = None


class ResumenFidelidad(BaseModel):
    usuario_id: UUID
    puntos: int
    sellos: int
    sandwiches: int = 0
    cafesGratis: int = 0
    premiosDinamicos: list[PremioDinamicoRead] = Field(default_factory=list)
    movimientos: list[MovimientoFidelidadRead]


class RankingFidelidadItem(BaseModel):
    id: UUID
    nombre: str
    correo: str
    codigo: str | None = None
    puntos: int
    sellos: int
    sandwiches: int


class FidelidadReglaBase(BaseModel):
    nombre: str = Field(min_length=1)
    tipo: TipoReglaFidelidad = TipoReglaFidelidad.PRINCIPAL
    puntos_por_sol: Decimal = Field(default=Decimal("1.00"), ge=0)
    sellos_por_pedido: int = Field(default=1, ge=0)
    puntos_canje_cafe: int = Field(default=0, ge=0)
    sellos_canje_cafe: int = Field(default=10, ge=0)
    producto_criterio_id: UUID | None = Field(
        default=None, validation_alias=AliasChoices("producto_criterio_id", "productoCriterioId")
    )
    cantidad_criterio: int | None = Field(
        default=None, ge=1, validation_alias=AliasChoices("cantidad_criterio", "cantidadCriterio")
    )
    producto_premio_id: UUID | None = Field(
        default=None, validation_alias=AliasChoices("producto_premio_id", "productoPremioId")
    )
    activo: bool = True

    model_config = ConfigDict(populate_by_name=True)


class FidelidadReglaCreate(FidelidadReglaBase):
    pass


class FidelidadReglaUpdate(BaseModel):
    nombre: str | None = Field(default=None, min_length=1)
    tipo: TipoReglaFidelidad | None = None
    puntos_por_sol: Decimal | None = Field(default=None, ge=0)
    sellos_por_pedido: int | None = Field(default=None, ge=0)
    puntos_canje_cafe: int | None = Field(default=None, ge=0)
    sellos_canje_cafe: int | None = Field(default=None, ge=0)
    producto_criterio_id: UUID | None = Field(
        default=None, validation_alias=AliasChoices("producto_criterio_id", "productoCriterioId")
    )
    cantidad_criterio: int | None = Field(
        default=None, ge=1, validation_alias=AliasChoices("cantidad_criterio", "cantidadCriterio")
    )
    producto_premio_id: UUID | None = Field(
        default=None, validation_alias=AliasChoices("producto_premio_id", "productoPremioId")
    )
    activo: bool | None = None

    model_config = ConfigDict(populate_by_name=True)


class FidelidadReglaRead(FidelidadReglaBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class CanjearPremioRequest(BaseModel):
    usuario_id: UUID | None = Field(default=None, validation_alias=AliasChoices("usuario_id", "estudianteId"))
    regla_id: UUID | None = Field(default=None, validation_alias=AliasChoices("regla_id", "progresoId"))
    puntos: int = Field(default=0, ge=0)
    sellos: int = Field(default=0, ge=0)
    descripcion: str | None = None

    model_config = ConfigDict(populate_by_name=True)


class CanjeResponse(BaseModel):
    ok: bool = True
    usuario_id: UUID
    puntos: int
    sellos: int
    cafesGratis: int = 0
    movimiento: MovimientoFidelidadRead
