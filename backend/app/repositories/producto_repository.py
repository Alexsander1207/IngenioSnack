from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.producto import Producto
from app.schemas.producto_schema import ProductoCreate, ProductoUpdate


class ProductoRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list(self) -> list[Producto]:
        result = self.db.execute(select(Producto).order_by(Producto.created_at.desc()))
        return list(result.scalars().all())

    def get(self, producto_id: UUID) -> Producto | None:
        return self.db.get(Producto, producto_id)

    def create(self, payload: ProductoCreate) -> Producto:
        producto = Producto(**payload.model_dump())
        self.db.add(producto)
        self.db.commit()
        self.db.refresh(producto)
        return producto

    def update(self, producto: Producto, payload: ProductoUpdate) -> Producto:
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(producto, field, value)
        self.db.commit()
        self.db.refresh(producto)
        return producto

    def soft_delete(self, producto: Producto) -> Producto:
        producto.activo = False
        self.db.commit()
        self.db.refresh(producto)
        return producto
