import re
import unicodedata
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.categoria import Categoria
from app.schemas.categoria_schema import CategoriaCreate, CategoriaUpdate


def _to_slug(text: str) -> str:
    normalized = unicodedata.normalize("NFKD", text)
    ascii_text = normalized.encode("ascii", "ignore").decode("ascii")
    slug = re.sub(r"[^\w\s-]", "", ascii_text).strip().lower()
    return re.sub(r"[\s_-]+", "-", slug)


class CategoriaRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list(self) -> list[Categoria]:
        result = self.db.execute(
            select(Categoria)
            .where(Categoria.activo.is_(True))
            .order_by(Categoria.nombre)
        )
        return list(result.scalars().all())

    def get(self, categoria_id: UUID) -> Categoria | None:
        return self.db.get(Categoria, categoria_id)

    def get_by_slug(self, slug: str) -> Categoria | None:
        result = self.db.execute(select(Categoria).where(Categoria.slug == slug))
        return result.scalar_one_or_none()

    def create(self, payload: CategoriaCreate) -> Categoria:
        slug = _to_slug(payload.nombre)
        if self.get_by_slug(slug):
            raise ValueError(f"Ya existe una categoría con el nombre '{payload.nombre}'.")
        categoria = Categoria(slug=slug, **payload.model_dump())
        self.db.add(categoria)
        self.db.commit()
        self.db.refresh(categoria)
        return categoria

    def update(self, categoria: Categoria, payload: CategoriaUpdate) -> Categoria:
        data = payload.model_dump(exclude_unset=True)
        if "nombre" in data:
            new_slug = _to_slug(data["nombre"])
            existing = self.get_by_slug(new_slug)
            if existing and existing.id != categoria.id:
                raise ValueError(f"Ya existe una categoría con el nombre '{data['nombre']}'.")
            data["slug"] = new_slug
        for field, value in data.items():
            setattr(categoria, field, value)
        self.db.commit()
        self.db.refresh(categoria)
        return categoria

    def soft_delete(self, categoria: Categoria) -> Categoria:
        categoria.activo = False
        self.db.commit()
        self.db.refresh(categoria)
        return categoria
