from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.promocion import Promocion
from app.schemas.promocion_schema import PromocionCreate, PromocionUpdate


class PromocionRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list(self) -> list[Promocion]:
        result = self.db.execute(select(Promocion).order_by(Promocion.created_at.desc()))
        return list(result.scalars().all())

    def list_activas(self) -> list[Promocion]:
        result = self.db.execute(
            select(Promocion)
            .where(Promocion.activo.is_(True))
            .order_by(Promocion.created_at.desc())
        )
        return list(result.scalars().all())

    def list_vigentes(self) -> list[Promocion]:
        now = datetime.now(timezone.utc)
        result = self.db.execute(
            select(Promocion)
            .where(
                Promocion.activo.is_(True),
                Promocion.disponible.is_(True),
                Promocion.fecha_inicio <= now,
                Promocion.fecha_fin >= now,
            )
            .order_by(Promocion.created_at.desc())
        )
        return list(result.scalars().all())

    def get(self, promocion_id: UUID) -> Promocion | None:
        return self.db.get(Promocion, promocion_id)

    def create(self, payload: PromocionCreate) -> Promocion:
        promocion = Promocion(**payload.model_dump())
        self.db.add(promocion)
        self.db.commit()
        self.db.refresh(promocion)
        return promocion

    def update(self, promocion: Promocion, payload: PromocionUpdate) -> Promocion:
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(promocion, field, value)
        self.db.commit()
        self.db.refresh(promocion)
        return promocion

    def soft_delete(self, promocion: Promocion) -> Promocion:
        promocion.activo = False
        self.db.commit()
        self.db.refresh(promocion)
        return promocion
