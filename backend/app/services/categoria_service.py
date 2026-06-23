from uuid import UUID

from app.models.categoria import Categoria
from app.repositories.categoria_repository import CategoriaRepository
from app.schemas.categoria_schema import CategoriaCreate, CategoriaUpdate


class CategoriaService:
    def __init__(self, repository: CategoriaRepository) -> None:
        self.repository = repository

    def list_categorias(self) -> list[Categoria]:
        return self.repository.list()

    def get_categoria(self, categoria_id: UUID) -> Categoria | None:
        return self.repository.get(categoria_id)

    def create_categoria(self, payload: CategoriaCreate) -> Categoria:
        return self.repository.create(payload)

    def update_categoria(self, categoria_id: UUID, payload: CategoriaUpdate) -> Categoria | None:
        categoria = self.repository.get(categoria_id)
        if not categoria:
            return None
        return self.repository.update(categoria, payload)

    def delete_categoria(self, categoria_id: UUID) -> Categoria | None:
        categoria = self.repository.get(categoria_id)
        if not categoria:
            return None
        return self.repository.soft_delete(categoria)
