from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.usuario import UsuarioRol


class UserRegister(BaseModel):
    nombre: str = Field(min_length=1)
    correo: EmailStr
    password: str = Field(min_length=8)
    codigo_estudiante: str | None = None


class UserLogin(BaseModel):
    correo: EmailStr
    password: str


class UserRead(BaseModel):
    id: UUID
    nombre: str
    correo: EmailStr
    codigo_estudiante: str | None = None
    rol: UsuarioRol
    activo: bool
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    sub: str
    rol: UsuarioRol | None = None
