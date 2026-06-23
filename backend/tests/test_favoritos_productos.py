from datetime import datetime, timezone
from decimal import Decimal
from types import SimpleNamespace
from uuid import uuid4

from fastapi.testclient import TestClient

from app.api.v1.favoritos import get_favorito_producto_service
from app.core.security import get_current_user
from app.main import app


client = TestClient(app)


class FakeFavoritoProductoService:
    def __init__(self) -> None:
        self.usuario_id = uuid4()
        self.producto_id = uuid4()
        self.favoritos = {}

    def _favorito(self):
        producto = SimpleNamespace(
            id=self.producto_id,
            nombre="Cafe",
            descripcion="Cafe pasado",
            precio=Decimal("3.50"),
            stock=10,
            categoria="Bebida",
            categoria_id=None,
            imagen_url=None,
            disponible=True,
            activo=True,
            calorias=12,
            proteinas=None,
            carbohidratos=None,
            grasas=None,
            alergenos=None,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        return SimpleNamespace(
            id=uuid4(),
            usuario_id=self.usuario_id,
            producto_id=self.producto_id,
            created_at=datetime.now(timezone.utc),
            producto=producto,
        )

    def list_favoritos(self, usuario_id):
        return list(self.favoritos.values())

    def add_favorito(self, usuario_id, producto_id):
        self.usuario_id = usuario_id
        self.producto_id = producto_id
        self.favoritos.setdefault((usuario_id, producto_id), self._favorito())
        return self.favoritos[(usuario_id, producto_id)]

    def remove_favorito(self, usuario_id, producto_id):
        self.favoritos.pop((usuario_id, producto_id), None)


def teardown_function():
    app.dependency_overrides.clear()


def test_favoritos_requires_authenticated_user():
    response = client.get("/api/v1/favoritos/productos")

    assert response.status_code == 401


def test_favoritos_productos_crud_without_real_database():
    usuario_id = uuid4()
    producto_id = uuid4()
    service = FakeFavoritoProductoService()
    app.dependency_overrides[get_current_user] = lambda: SimpleNamespace(id=usuario_id, activo=True)
    app.dependency_overrides[get_favorito_producto_service] = lambda: service

    created = client.post(f"/api/v1/favoritos/productos/{producto_id}")
    duplicated = client.post(f"/api/v1/favoritos/productos/{producto_id}")
    listed = client.get("/api/v1/favoritos/productos")
    deleted = client.delete(f"/api/v1/favoritos/productos/{producto_id}")
    listed_after_delete = client.get("/api/v1/favoritos/productos")

    assert created.status_code == 201
    assert duplicated.status_code == 201
    assert len(listed.json()) == 1
    assert listed.json()[0]["producto_id"] == str(producto_id)
    assert listed.json()[0]["producto"]["calorias"] == 12
    assert deleted.status_code == 204
    assert listed_after_delete.json() == []
