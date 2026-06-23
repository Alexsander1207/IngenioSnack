from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ProductoBase(BaseModel):
    nombre: str = Field(min_length=1)
    descripcion: str | None = None
    precio: Decimal = Field(ge=0)
    stock: int = Field(default=0, ge=0)
    categoria: str | None = None
    imagen_url: str | None = None
    activo: bool = True


class ProductoCreate(ProductoBase):
    pass


class ProductoUpdate(BaseModel):
    nombre: str | None = Field(default=None, min_length=1)
    descripcion: str | None = None
    precio: Decimal | None = Field(default=None, ge=0)
    stock: int | None = Field(default=None, ge=0)
    categoria: str | None = None
    imagen_url: str | None = None
    activo: bool | None = None


class ProductoRead(ProductoBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
