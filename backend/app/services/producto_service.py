from uuid import UUID

from app.models.producto import Producto
from app.repositories.producto_repository import ProductoRepository
from app.schemas.producto_schema import ProductoCreate, ProductoUpdate


class ProductoService:
    def __init__(self, repository: ProductoRepository) -> None:
        self.repository = repository

    def list_productos(self) -> list[Producto]:
        return self.repository.list()

    def get_producto(self, producto_id: UUID) -> Producto | None:
        return self.repository.get(producto_id)

    def create_producto(self, payload: ProductoCreate) -> Producto:
        return self.repository.create(payload)

    def update_producto(self, producto_id: UUID, payload: ProductoUpdate) -> Producto | None:
        producto = self.repository.get(producto_id)
        if not producto:
            return None
        return self.repository.update(producto, payload)

    def delete_producto(self, producto_id: UUID) -> Producto | None:
        producto = self.repository.get(producto_id)
        if not producto:
            return None
        return self.repository.soft_delete(producto)
