from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


class CategoriaBase(BaseModel):
    nombre: str = Field(min_length=1)
    descripcion: str | None = None
    activo: bool = True

    @field_validator("nombre")
    @classmethod
    def nombre_not_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("El nombre no puede ser solo espacios.")
        return v


class CategoriaCreate(CategoriaBase):
    pass


class CategoriaUpdate(BaseModel):
    nombre: str | None = Field(default=None, min_length=1)
    descripcion: str | None = None
    activo: bool | None = None


class CategoriaRead(CategoriaBase):
    id: UUID
    slug: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
