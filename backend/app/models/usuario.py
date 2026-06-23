import enum
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class UsuarioRol(str, enum.Enum):
    ADMIN = "ADMIN"
    ESTUDIANTE = "ESTUDIANTE"


class Usuario(Base):
    __tablename__ = "usuarios"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    nombre: Mapped[str] = mapped_column(String, nullable=False)
    correo: Mapped[str] = mapped_column(String, nullable=False, unique=True, index=True)
    codigo_estudiante: Mapped[str | None] = mapped_column(String, nullable=True, unique=True)
    hashed_password: Mapped[str] = mapped_column(String, nullable=False)
    rol: Mapped[UsuarioRol] = mapped_column(Enum(UsuarioRol), nullable=False, default=UsuarioRol.ESTUDIANTE)
    activo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    conducta_score: Mapped[int] = mapped_column(Integer, nullable=False, default=100)
    banned_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    ban_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
