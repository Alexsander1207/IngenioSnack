"""
Tests para FASE 6 -- modulo Stock.
No dependen de una base de datos real: usan dependency_overrides y fakes.
"""
from datetime import datetime, timezone
from types import SimpleNamespace
from uuid import uuid4

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.api.v1.stock import get_stock_service
from app.core.security import get_current_user
from app.main import app
from app.models.stock import TipoMovimiento
from app.models.usuario import UsuarioRol
from app.schemas.stock_schema import MovimientoCreate, MovimientoRead


client = TestClient(app)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_movimiento(**overrides):
    defaults = dict(
        id=uuid4(),
        producto_id=uuid4(),
        pedido_id=None,
        tipo_movimiento=TipoMovimiento.ENTRADA,
        cantidad=5,
        stock_anterior=10,
        stock_nuevo=15,
        motivo=None,
        created_at=datetime.now(timezone.utc),
    )
    return SimpleNamespace(**{**defaults, **overrides})


class FakeStockService:
    def list_stock(self):
        return []

    def list_movimientos(self):
        return []

    def list_movimientos_por_producto(self, producto_id):
        return []

    def list_alertas(self):
        return []

    def crear_movimiento(self, payload):
        return _make_movimiento(
            producto_id=payload.producto_id,
            tipo_movimiento=payload.tipo_movimiento,
            cantidad=payload.cantidad,
        )


def teardown_function():
    app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# Tests de health (no debe romperse con el nuevo modulo)
# ---------------------------------------------------------------------------

def test_health_sigue_funcionando():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


# ---------------------------------------------------------------------------
# Tests de endpoints -- GET
# ---------------------------------------------------------------------------

def test_list_stock_devuelve_lista():
    app.dependency_overrides[get_stock_service] = lambda: FakeStockService()
    response = client.get("/api/v1/stock")
    assert response.status_code == 200
    assert response.json() == []


def test_list_movimientos_devuelve_lista():
    app.dependency_overrides[get_stock_service] = lambda: FakeStockService()
    response = client.get("/api/v1/stock/movimientos")
    assert response.status_code == 200
    assert response.json() == []


# ---------------------------------------------------------------------------
# Tests de schema -- validaciones Pydantic
# ---------------------------------------------------------------------------

def test_schema_rechaza_cantidad_cero():
    with pytest.raises(ValidationError):
        MovimientoCreate(
            producto_id=uuid4(),
            tipo_movimiento=TipoMovimiento.ENTRADA,
            cantidad=0,
        )


def test_schema_rechaza_cantidad_negativa():
    with pytest.raises(ValidationError):
        MovimientoCreate(
            producto_id=uuid4(),
            tipo_movimiento=TipoMovimiento.SALIDA,
            cantidad=-5,
        )


def test_schema_rechaza_stock_nuevo_negativo():
    with pytest.raises(ValidationError):
        MovimientoRead(
            id=uuid4(),
            producto_id=uuid4(),
            pedido_id=None,
            tipo_movimiento=TipoMovimiento.SALIDA,
            cantidad=5,
            stock_anterior=3,
            stock_nuevo=-1,
            motivo=None,
            created_at=datetime.now(timezone.utc),
        )


# ---------------------------------------------------------------------------
# Tests de reglas de negocio -- service directo con fakes
# ---------------------------------------------------------------------------

class FakeProductoRepo:
    def __init__(self, stock=5):
        self._producto = SimpleNamespace(
            id=uuid4(),
            nombre="Test",
            categoria="Snack",
            stock=stock,
            activo=True,
        )

    def get(self, producto_id):
        return self._producto

    def list(self):
        return [self._producto]


class FakeStockRepo:
    def list_movimientos(self):
        return []

    def list_movimientos_por_producto(self, producto_id):
        return []

    def create_movimiento(self, producto, tipo_movimiento, cantidad, stock_anterior, stock_nuevo, pedido_id, motivo):
        return _make_movimiento(
            producto_id=producto.id,
            tipo_movimiento=tipo_movimiento,
            cantidad=cantidad,
            stock_anterior=stock_anterior,
            stock_nuevo=stock_nuevo,
        )


def test_service_rechaza_salida_que_deja_stock_negativo():
    from app.services.stock_service import StockService

    service = StockService(
        stock_repo=FakeStockRepo(),
        producto_repo=FakeProductoRepo(stock=3),
    )
    payload = MovimientoCreate(
        producto_id=uuid4(),
        tipo_movimiento=TipoMovimiento.SALIDA,
        cantidad=10,
    )

    with pytest.raises(ValueError):
        service.crear_movimiento(payload)


def test_service_rechaza_venta_que_deja_stock_negativo():
    from app.services.stock_service import StockService

    service = StockService(
        stock_repo=FakeStockRepo(),
        producto_repo=FakeProductoRepo(stock=2),
    )
    payload = MovimientoCreate(
        producto_id=uuid4(),
        tipo_movimiento=TipoMovimiento.VENTA,
        cantidad=5,
    )

    with pytest.raises(ValueError):
        service.crear_movimiento(payload)


def test_alertas_stock_bajo_devuelven_productos_bajo_umbral():
    from app.services.stock_service import StockService

    service = StockService(
        stock_repo=FakeStockRepo(),
        producto_repo=FakeProductoRepo(stock=3),
    )

    alertas = service.list_alertas(umbral=5)

    assert len(alertas) == 1
    assert alertas[0].stock_actual == 3
    assert alertas[0].categoria == "Snack"


# ---------------------------------------------------------------------------
# Tests de autorizacion -- ruta admin POST /stock/movimientos
# ---------------------------------------------------------------------------

def test_ruta_admin_rechaza_sin_token():
    response = client.post(
        "/api/v1/stock/movimientos",
        json={
            "producto_id": str(uuid4()),
            "tipo_movimiento": "ENTRADA",
            "cantidad": 10,
        },
    )
    assert response.status_code == 401


def test_ruta_admin_rechaza_rol_estudiante():
    app.dependency_overrides[get_current_user] = lambda: SimpleNamespace(
        id=uuid4(),
        rol=UsuarioRol.ESTUDIANTE,
        activo=True,
    )
    app.dependency_overrides[get_stock_service] = lambda: FakeStockService()

    response = client.post(
        "/api/v1/stock/movimientos",
        json={
            "producto_id": str(uuid4()),
            "tipo_movimiento": "ENTRADA",
            "cantidad": 10,
        },
    )
    assert response.status_code == 403


def test_ruta_admin_permite_rol_admin():
    app.dependency_overrides[get_current_user] = lambda: SimpleNamespace(
        id=uuid4(),
        rol=UsuarioRol.ADMIN,
        activo=True,
    )
    app.dependency_overrides[get_stock_service] = lambda: FakeStockService()

    response = client.post(
        "/api/v1/stock/movimientos",
        json={
            "producto_id": str(uuid4()),
            "tipo_movimiento": "ENTRADA",
            "cantidad": 10,
        },
    )
    assert response.status_code == 201
