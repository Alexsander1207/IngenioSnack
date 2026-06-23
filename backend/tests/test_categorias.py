from datetime import datetime, timezone
from types import SimpleNamespace
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.api.v1.categorias import get_categoria_service
from app.core.security import get_current_user
from app.main import app
from app.models.usuario import UsuarioRol
from app.schemas.categoria_schema import CategoriaCreate


client = TestClient(app)

_FAKE_ID = uuid4()


class FakeCategoriaService:
    def __init__(self) -> None:
        self.categoria = SimpleNamespace(
            id=_FAKE_ID,
            nombre="Bebidas",
            slug="bebidas",
            descripcion=None,
            activo=True,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )

    def list_categorias(self):
        return [self.categoria]

    def get_categoria(self, categoria_id):
        return self.categoria if categoria_id == self.categoria.id else None

    def create_categoria(self, payload):
        self.categoria.nombre = payload.nombre
        self.categoria.slug = payload.nombre.lower().replace(" ", "-")
        return self.categoria

    def update_categoria(self, categoria_id, payload):
        if categoria_id != self.categoria.id:
            return None
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(self.categoria, field, value)
        return self.categoria

    def delete_categoria(self, categoria_id):
        if categoria_id != self.categoria.id:
            return None
        self.categoria.activo = False
        return self.categoria


def teardown_function():
    app.dependency_overrides.clear()


def _override_admin():
    app.dependency_overrides[get_current_user] = lambda: SimpleNamespace(
        id=uuid4(), rol=UsuarioRol.ADMIN, activo=True
    )
    app.dependency_overrides[get_categoria_service] = lambda: FakeCategoriaService()


# --- GET ---

def test_get_categorias_returns_list():
    app.dependency_overrides[get_categoria_service] = lambda: FakeCategoriaService()

    response = client.get("/api/v1/categorias")

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 1
    assert data[0]["nombre"] == "Bebidas"
    assert data[0]["slug"] == "bebidas"


# --- Schema validation ---

def test_categoria_schema_rejects_empty_nombre():
    with pytest.raises(ValidationError):
        CategoriaCreate(nombre="")


def test_categoria_schema_rejects_whitespace_only_nombre():
    with pytest.raises(ValidationError):
        CategoriaCreate(nombre="   ")


# --- POST ---

def test_post_categoria_without_token_returns_401():
    response = client.post("/api/v1/categorias", json={"nombre": "Snacks"})

    assert response.status_code == 401


def test_post_categoria_with_student_role_returns_403():
    app.dependency_overrides[get_current_user] = lambda: SimpleNamespace(
        id=uuid4(), rol=UsuarioRol.ESTUDIANTE, activo=True
    )
    app.dependency_overrides[get_categoria_service] = lambda: FakeCategoriaService()

    response = client.post("/api/v1/categorias", json={"nombre": "Snacks"})

    assert response.status_code == 403


def test_post_categoria_with_admin_role_returns_201():
    _override_admin()

    response = client.post("/api/v1/categorias", json={"nombre": "Snacks"})

    assert response.status_code == 201
    assert response.json()["nombre"] == "Snacks"
    assert "slug" in response.json()


# --- DELETE (soft delete) ---

def test_delete_categoria_marks_activo_false():
    _override_admin()

    response = client.delete(f"/api/v1/categorias/{_FAKE_ID}")

    assert response.status_code == 200
    assert response.json()["activo"] is False


def test_delete_categoria_not_found_returns_404():
    _override_admin()

    response = client.delete(f"/api/v1/categorias/{uuid4()}")

    assert response.status_code == 404


# --- Slug generation ---

def test_slug_from_nombre_is_normalized():
    from app.repositories.categoria_repository import _to_slug

    assert _to_slug("Bebidas Calientes") == "bebidas-calientes"
    assert _to_slug("Sándwiches") == "sandwiches"
    assert _to_slug("  Snacks  ") == "snacks"
    assert _to_slug("Café & Té") == "cafe-te"
