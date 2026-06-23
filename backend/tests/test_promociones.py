from datetime import datetime, timezone
from decimal import Decimal
from types import SimpleNamespace
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.api.v1.promociones import get_promocion_service
from app.core.security import get_current_user
from app.main import app
from app.models.promocion import PromocionTipo
from app.models.usuario import UsuarioRol
from app.schemas.promocion_schema import PromocionCreate


client = TestClient(app)


class FakePromocionService:
    def __init__(self) -> None:
        self.promocion = SimpleNamespace(
            id=uuid4(),
            nombre="2x1 Empanadas",
            descripcion=None,
            tipo=PromocionTipo.COMBO,
            valor=Decimal("5.00"),
            fecha_inicio=datetime(2025, 1, 1, tzinfo=timezone.utc),
            fecha_fin=datetime(2025, 12, 31, tzinfo=timezone.utc),
            imagen_url=None,
            activo=True,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )

    def list_promociones(self):
        return []

    def list_activas(self):
        return []

    def get_promocion(self, promocion_id):
        return self.promocion if promocion_id == self.promocion.id else None

    def create_promocion(self, payload):
        for field, value in payload.model_dump().items():
            setattr(self.promocion, field, value)
        return self.promocion

    def update_promocion(self, promocion_id, payload):
        if promocion_id != self.promocion.id:
            return None
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(self.promocion, field, value)
        return self.promocion

    def delete_promocion(self, promocion_id):
        if promocion_id != self.promocion.id:
            return None
        self.promocion.activo = False
        return self.promocion


def teardown_function():
    app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------


def test_health_sigue_funcionando():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


# ---------------------------------------------------------------------------
# Public read endpoints
# ---------------------------------------------------------------------------


def test_list_promociones_devuelve_lista():
    app.dependency_overrides[get_promocion_service] = lambda: FakePromocionService()

    response = client.get("/api/v1/promociones")

    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_list_activas_devuelve_lista():
    app.dependency_overrides[get_promocion_service] = lambda: FakePromocionService()

    response = client.get("/api/v1/promociones/activas")

    assert response.status_code == 200
    assert isinstance(response.json(), list)


# ---------------------------------------------------------------------------
# Schema validation
# ---------------------------------------------------------------------------


def test_schema_rechaza_valor_negativo():
    with pytest.raises(ValidationError):
        PromocionCreate(
            nombre="Promo test",
            tipo=PromocionTipo.DESCUENTO_FIJO,
            valor=Decimal("-5.00"),
            fecha_inicio=datetime(2025, 1, 1, tzinfo=timezone.utc),
            fecha_fin=datetime(2025, 12, 31, tzinfo=timezone.utc),
        )


def test_schema_rechaza_fecha_fin_anterior_a_inicio():
    with pytest.raises(ValidationError):
        PromocionCreate(
            nombre="Promo test",
            tipo=PromocionTipo.DESCUENTO_FIJO,
            valor=Decimal("10.00"),
            fecha_inicio=datetime(2025, 12, 31, tzinfo=timezone.utc),
            fecha_fin=datetime(2025, 1, 1, tzinfo=timezone.utc),
        )


# ---------------------------------------------------------------------------
# Admin route access control
# ---------------------------------------------------------------------------


def test_crear_promocion_sin_token_rechaza_401():
    response = client.post(
        "/api/v1/promociones",
        json={
            "nombre": "Promo sin auth",
            "tipo": "DESCUENTO_FIJO",
            "valor": "10.00",
            "fecha_inicio": "2025-01-01T00:00:00Z",
            "fecha_fin": "2025-12-31T00:00:00Z",
        },
    )
    assert response.status_code == 401


def test_crear_promocion_con_rol_estudiante_rechaza_403():
    app.dependency_overrides[get_current_user] = lambda: SimpleNamespace(
        id=uuid4(),
        rol=UsuarioRol.ESTUDIANTE,
        activo=True,
    )
    app.dependency_overrides[get_promocion_service] = lambda: FakePromocionService()

    response = client.post(
        "/api/v1/promociones",
        json={
            "nombre": "Promo estudiante",
            "tipo": "DESCUENTO_FIJO",
            "valor": "10.00",
            "fecha_inicio": "2025-01-01T00:00:00Z",
            "fecha_fin": "2025-12-31T00:00:00Z",
        },
    )

    assert response.status_code == 403


def test_crear_promocion_con_rol_admin_permite_201():
    app.dependency_overrides[get_current_user] = lambda: SimpleNamespace(
        id=uuid4(),
        rol=UsuarioRol.ADMIN,
        activo=True,
    )
    app.dependency_overrides[get_promocion_service] = lambda: FakePromocionService()

    response = client.post(
        "/api/v1/promociones",
        json={
            "nombre": "Promo admin",
            "tipo": "DESCUENTO_FIJO",
            "valor": "10.00",
            "fecha_inicio": "2025-01-01T00:00:00Z",
            "fecha_fin": "2025-12-31T00:00:00Z",
        },
    )

    assert response.status_code == 201
    assert response.json()["nombre"] == "Promo admin"
