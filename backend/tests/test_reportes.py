from datetime import datetime, timezone
from decimal import Decimal
from types import SimpleNamespace
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.api.v1.reportes import get_reporte_service
from app.core.security import get_current_user
from app.main import app
from app.models.usuario import UsuarioRol
from app.schemas.reporte_schema import (
    FidelidadData,
    FidelidadResponse,
    FiltrosVentasRead,
    ProductosData,
    ProductosResponse,
    ResumenData,
    ResumenResponse,
    VentasData,
    VentasResponse,
)


client = TestClient(app)

_NOW = datetime.now(timezone.utc)


class FakeReporteService:
    def get_resumen(self) -> ResumenResponse:
        return ResumenResponse(
            data=ResumenData(
                total_pedidos=10,
                ventas_totales=Decimal("250.00"),
                pedidos_pendientes=3,
                pedidos_recogidos=5,
                productos_activos=8,
                stock_bajo=2,
                puntos_emitidos=100,
                sellos_emitidos=20,
            ),
            generated_at=_NOW,
        )

    def get_ventas(self, fecha_inicio, fecha_fin, estado) -> VentasResponse:
        return VentasResponse(
            data=VentasData(),
            filters=FiltrosVentasRead(
                fecha_inicio=fecha_inicio,
                fecha_fin=fecha_fin,
                estado=estado.value if estado else None,
            ),
            generated_at=_NOW,
        )

    def get_productos(self) -> ProductosResponse:
        return ProductosResponse(data=ProductosData(), generated_at=_NOW)

    def get_fidelidad(self) -> FidelidadResponse:
        return FidelidadResponse(data=FidelidadData(), generated_at=_NOW)


def _admin():
    return SimpleNamespace(id=uuid4(), rol=UsuarioRol.ADMIN, activo=True)


def _estudiante():
    return SimpleNamespace(id=uuid4(), rol=UsuarioRol.ESTUDIANTE, activo=True)


def teardown_function():
    app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------


def test_health_sigue_funcionando():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


# ---------------------------------------------------------------------------
# Auth guards — apply to ALL /reportes/* endpoints
# ---------------------------------------------------------------------------


def test_reportes_rechaza_sin_token_401():
    response = client.get("/api/v1/reportes/resumen")
    assert response.status_code == 401


def test_reportes_rechaza_rol_estudiante_403():
    app.dependency_overrides[get_current_user] = _estudiante
    app.dependency_overrides[get_reporte_service] = lambda: FakeReporteService()

    response = client.get("/api/v1/reportes/resumen")

    assert response.status_code == 403


def test_reportes_permite_admin_200():
    app.dependency_overrides[get_current_user] = _admin
    app.dependency_overrides[get_reporte_service] = lambda: FakeReporteService()

    response = client.get("/api/v1/reportes/resumen")

    assert response.status_code == 200


# ---------------------------------------------------------------------------
# /resumen — estructura esperada
# ---------------------------------------------------------------------------


def test_resumen_devuelve_estructura_esperada():
    app.dependency_overrides[get_current_user] = _admin
    app.dependency_overrides[get_reporte_service] = lambda: FakeReporteService()

    response = client.get("/api/v1/reportes/resumen")

    assert response.status_code == 200
    payload = response.json()
    data = payload["data"]
    assert "total_pedidos" in data
    assert "ventas_totales" in data
    assert "pedidos_pendientes" in data
    assert "pedidos_recogidos" in data
    assert "productos_activos" in data
    assert "stock_bajo" in data
    assert "puntos_emitidos" in data
    assert "sellos_emitidos" in data
    assert "generated_at" in payload
    assert data["total_pedidos"] == 10
    assert data["puntos_emitidos"] == 100


# ---------------------------------------------------------------------------
# /ventas — filtros y validación de fechas
# ---------------------------------------------------------------------------


def test_ventas_rechaza_fecha_fin_anterior_a_inicio_422():
    app.dependency_overrides[get_current_user] = _admin
    app.dependency_overrides[get_reporte_service] = lambda: FakeReporteService()

    response = client.get(
        "/api/v1/reportes/ventas",
        params={
            "fecha_inicio": "2025-12-31T00:00:00",
            "fecha_fin": "2025-01-01T00:00:00",
        },
    )

    assert response.status_code == 422


def test_ventas_devuelve_estructura_con_listas():
    app.dependency_overrides[get_current_user] = _admin
    app.dependency_overrides[get_reporte_service] = lambda: FakeReporteService()

    response = client.get("/api/v1/reportes/ventas")

    assert response.status_code == 200
    payload = response.json()
    data = payload["data"]
    assert "total_ventas" in data
    assert "cantidad_pedidos" in data
    assert "ticket_promedio" in data
    assert isinstance(data["ventas_por_estado"], list)
    assert isinstance(data["ventas_por_dia"], list)
    assert "filters" in payload
    assert "generated_at" in payload


# ---------------------------------------------------------------------------
# /productos — listas vacías si no hay datos
# ---------------------------------------------------------------------------


def test_productos_devuelve_listas_aunque_no_haya_datos():
    app.dependency_overrides[get_current_user] = _admin
    app.dependency_overrides[get_reporte_service] = lambda: FakeReporteService()

    response = client.get("/api/v1/reportes/productos")

    assert response.status_code == 200
    payload = response.json()
    data = payload["data"]
    assert isinstance(data["productos_mas_vendidos"], list)
    assert isinstance(data["productos_con_stock_bajo"], list)
    assert "productos_activos" in data
    assert "productos_inactivos" in data


# ---------------------------------------------------------------------------
# /fidelidad — ceros si no hay datos
# ---------------------------------------------------------------------------


def test_fidelidad_devuelve_ceros_si_no_hay_datos():
    app.dependency_overrides[get_current_user] = _admin
    app.dependency_overrides[get_reporte_service] = lambda: FakeReporteService()

    response = client.get("/api/v1/reportes/fidelidad")

    assert response.status_code == 200
    payload = response.json()
    data = payload["data"]
    assert data["puntos_emitidos"] == 0
    assert data["sellos_emitidos"] == 0
    assert data["usuarios_con_fidelidad"] == 0
    assert isinstance(data["movimientos_recientes"], list)
    assert len(data["movimientos_recientes"]) == 0
