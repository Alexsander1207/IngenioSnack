from uuid import UUID

from app.models.promocion import Promocion
from app.repositories.promocion_repository import PromocionRepository
from app.schemas.promocion_schema import PromocionCreate, PromocionUpdate


class PromocionService:
    def __init__(self, repository: PromocionRepository) -> None:
        self.repository = repository

    def list_promociones(self) -> list[Promocion]:
        return self.repository.list()

    def list_activas(self) -> list[Promocion]:
        return self.repository.list_activas()

    def get_promocion(self, promocion_id: UUID) -> Promocion | None:
        return self.repository.get(promocion_id)

    def create_promocion(self, payload: PromocionCreate) -> Promocion:
        return self.repository.create(payload)

    def update_promocion(self, promocion_id: UUID, payload: PromocionUpdate) -> Promocion | None:
        promocion = self.repository.get(promocion_id)
        if not promocion:
            return None
        return self.repository.update(promocion, payload)

    def delete_promocion(self, promocion_id: UUID) -> Promocion | None:
        promocion = self.repository.get(promocion_id)
        if not promocion:
            return None
        return self.repository.soft_delete(promocion)
