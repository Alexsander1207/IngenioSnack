from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.producto import FavoritoProducto, Producto


class FavoritoProductoRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_by_usuario(self, usuario_id: UUID) -> list[FavoritoProducto]:
        result = self.db.execute(
            select(FavoritoProducto)
            .options(selectinload(FavoritoProducto.producto))
            .join(Producto, Producto.id == FavoritoProducto.producto_id)
            .where(
                FavoritoProducto.usuario_id == usuario_id,
                Producto.activo == True,  # noqa: E712
            )
            .order_by(FavoritoProducto.created_at.desc())
        )
        return list(result.scalars().all())

    def get_by_usuario_producto(self, usuario_id: UUID, producto_id: UUID) -> FavoritoProducto | None:
        result = self.db.execute(
            select(FavoritoProducto).where(
                FavoritoProducto.usuario_id == usuario_id,
                FavoritoProducto.producto_id == producto_id,
            )
        )
        return result.scalar_one_or_none()

    def create(self, usuario_id: UUID, producto_id: UUID) -> FavoritoProducto:
        favorito = FavoritoProducto(usuario_id=usuario_id, producto_id=producto_id)
        self.db.add(favorito)
        self.db.commit()
        self.db.refresh(favorito)
        return favorito

    def delete(self, favorito: FavoritoProducto) -> None:
        self.db.delete(favorito)
        self.db.commit()
