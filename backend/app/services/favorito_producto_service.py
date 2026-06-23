from uuid import UUID

from fastapi import HTTPException, status

from app.models.producto import FavoritoProducto
from app.repositories.favorito_producto_repository import FavoritoProductoRepository
from app.repositories.producto_repository import ProductoRepository


class FavoritoProductoService:
    def __init__(
        self,
        favorito_repository: FavoritoProductoRepository,
        producto_repository: ProductoRepository,
    ) -> None:
        self.favorito_repository = favorito_repository
        self.producto_repository = producto_repository

    def list_favoritos(self, usuario_id: UUID) -> list[FavoritoProducto]:
        return self.favorito_repository.list_by_usuario(usuario_id)

    def add_favorito(self, usuario_id: UUID, producto_id: UUID) -> FavoritoProducto:
        producto = self.producto_repository.get(producto_id)
        if not producto or not getattr(producto, "activo", True):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado.")

        favorito = self.favorito_repository.get_by_usuario_producto(usuario_id, producto_id)
        if favorito:
            return favorito

        return self.favorito_repository.create(usuario_id, producto_id)

    def remove_favorito(self, usuario_id: UUID, producto_id: UUID) -> None:
        favorito = self.favorito_repository.get_by_usuario_producto(usuario_id, producto_id)
        if favorito:
            self.favorito_repository.delete(favorito)
