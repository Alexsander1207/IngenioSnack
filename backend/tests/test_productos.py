from datetime import datetime, timezone
from decimal import Decimal
from types import SimpleNamespace
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.api.v1.productos import get_producto_service
from app.core.security import get_current_user
from app.main import app
from app.models.usuario import UsuarioRol
from app.schemas.producto_schema import ProductoCreate


client = TestClient(app)


class FakeProductoService:
    def __init__(self) -> None:
        self.producto = SimpleNamespace(
            id=uuid4(),
            nombre="Cafe americano",
            descripcion=None,
            precio=Decimal("3.50"),
            stock=10,
            categoria="Bebida",
            categoria_id=None,
            imagen_url=None,
            disponible=True,
            activo=True,
            calorias=None,
            proteinas=None,
            carbohidratos=None,
            grasas=None,
            alergenos=None,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )

    def list_productos(self):
        return []

    def get_producto(self, producto_id):
        return self.producto if producto_id == self.producto.id else None

    def create_producto(self, payload):
        for field, value in payload.model_dump().items():
            setattr(self.producto, field, value)
        return self.producto

    def update_producto(self, producto_id, payload):
        if producto_id != self.producto.id:
            return None
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(self.producto, field, value)
        return self.producto

    def delete_producto(self, producto_id):
        if producto_id != self.producto.id:
            return None
        self.producto.activo = False
        return self.producto


def teardown_function():
    app.dependency_overrides.clear()


def test_get_productos_returns_list_without_real_database():
    app.dependency_overrides[get_producto_service] = lambda: FakeProductoService()

    response = client.get("/api/v1/productos")

    assert response.status_code == 200
    assert response.json() == []


def test_producto_schema_rejects_negative_price():
    with pytest.raises(ValidationError):
        ProductoCreate(nombre="Cafe", precio=Decimal("-1"), stock=0)


def test_producto_schema_accepts_nullable_nutrition_fields():
    producto = ProductoCreate(
        nombre="Barra energetica",
        descripcion="Snack de avena",
        precio=Decimal("4.00"),
        stock=8,
        calorias=180,
        proteinas=Decimal("6.5"),
        carbohidratos=Decimal("24.0"),
        grasas=Decimal("5.0"),
        alergenos="mani",
    )

    assert producto.calorias == 180
    assert producto.alergenos == "mani"


def test_admin_product_route_rejects_access_without_token():
    response = client.post(
        "/api/v1/productos",
        json={"nombre": "Cafe", "precio": "3.50", "stock": 5},
    )

    assert response.status_code == 401


def test_admin_product_route_rejects_student_role():
    app.dependency_overrides[get_current_user] = lambda: SimpleNamespace(
        id=uuid4(),
        rol=UsuarioRol.ESTUDIANTE,
        activo=True,
    )
    app.dependency_overrides[get_producto_service] = lambda: FakeProductoService()

    response = client.post(
        "/api/v1/productos",
        json={"nombre": "Cafe", "precio": "3.50", "stock": 5},
    )

    assert response.status_code == 403


def test_admin_product_route_allows_admin_role():
    app.dependency_overrides[get_current_user] = lambda: SimpleNamespace(
        id=uuid4(),
        rol=UsuarioRol.ADMIN,
        activo=True,
    )
    app.dependency_overrides[get_producto_service] = lambda: FakeProductoService()

    response = client.post(
        "/api/v1/productos",
        json={"nombre": "Cafe", "precio": "3.50", "stock": 5},
    )

    assert response.status_code == 201
    assert response.json()["nombre"] == "Cafe"
