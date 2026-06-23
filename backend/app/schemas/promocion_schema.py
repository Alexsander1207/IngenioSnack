from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, computed_field, model_validator

from app.models.promocion import PromocionTipo


class PromocionBase(BaseModel):
    nombre: str = Field(min_length=1)
    descripcion: str | None = None
    tipo: PromocionTipo = PromocionTipo.COMBO
    valor: Decimal = Field(ge=0)
    puntos_requeridos: int = Field(default=0, ge=0)
    disponible: bool = True
    fecha_inicio: datetime
    fecha_fin: datetime
    imagen_url: str | None = None
    activo: bool = True

    @model_validator(mode="after")
    def fecha_fin_no_anterior_a_inicio(self) -> "PromocionBase":
        if self.fecha_fin < self.fecha_inicio:
            raise ValueError("fecha_fin no puede ser anterior a fecha_inicio.")
        return self


class PromocionCreate(PromocionBase):
    pass


class PromocionUpdate(BaseModel):
    nombre: str | None = Field(default=None, min_length=1)
    descripcion: str | None = None
    tipo: PromocionTipo | None = None
    valor: Decimal | None = Field(default=None, ge=0)
    puntos_requeridos: int | None = Field(default=None, ge=0)
    disponible: bool | None = None
    fecha_inicio: datetime | None = None
    fecha_fin: datetime | None = None
    imagen_url: str | None = None
    activo: bool | None = None

    @model_validator(mode="after")
    def fecha_fin_no_anterior_a_inicio(self) -> "PromocionUpdate":
        if self.fecha_inicio and self.fecha_fin and self.fecha_fin < self.fecha_inicio:
            raise ValueError("fecha_fin no puede ser anterior a fecha_inicio.")
        return self


class PromocionRead(PromocionBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    @computed_field
    @property
    def precio(self) -> Decimal:
        return self.valor

    model_config = ConfigDict(from_attributes=True)
