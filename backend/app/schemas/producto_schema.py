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
    categoria_id: UUID | None = None
    imagen_url: str | None = None
    disponible: bool = True
    activo: bool = True
    calorias: int | None = Field(default=None, ge=0)
    proteinas: Decimal | None = Field(default=None, ge=0)
    carbohidratos: Decimal | None = Field(default=None, ge=0)
    grasas: Decimal | None = Field(default=None, ge=0)
    alergenos: str | None = None


class ProductoCreate(ProductoBase):
    pass


class ProductoUpdate(BaseModel):
    nombre: str | None = Field(default=None, min_length=1)
    descripcion: str | None = None
    precio: Decimal | None = Field(default=None, ge=0)
    stock: int | None = Field(default=None, ge=0)
    categoria: str | None = None
    categoria_id: UUID | None = None
    imagen_url: str | None = None
    disponible: bool | None = None
    activo: bool | None = None
    calorias: int | None = Field(default=None, ge=0)
    proteinas: Decimal | None = Field(default=None, ge=0)
    carbohidratos: Decimal | None = Field(default=None, ge=0)
    grasas: Decimal | None = Field(default=None, ge=0)
    alergenos: str | None = None


class ProductoRead(ProductoBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class FavoritoProductoRead(BaseModel):
    id: UUID
    usuario_id: UUID
    producto_id: UUID
    created_at: datetime
    producto: ProductoRead | None = None

    model_config = ConfigDict(from_attributes=True)
