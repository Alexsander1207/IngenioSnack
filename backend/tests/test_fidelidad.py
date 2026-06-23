"""
Tests para FASE 8 -- modulo Fidelidad.
No dependen de base de datos real: usan dependency_overrides y fakes.
"""
from datetime import datetime, timezone
from decimal import Decimal
from types import SimpleNamespace
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.api.v1.fidelidad import get_fidelidad_service
from app.core.security import get_current_user
from app.main import app
from app.models.fidelidad import TipoMovimientoFidelidad
from app.models.usuario import UsuarioRol
from app.schemas.fidelidad_schema import MovimientoFidelidadCreate, ResumenFidelidad


client = TestClient(app)


# ---------------------------------------------------------------------------
# Helpers / Fakes
# ---------------------------------------------------------------------------

def _make_movimiento_ns(**overrides):
    defaults = dict(
        id=uuid4(),
        usuario_id=uuid4(),
        pedido_id=None,
        tipo_movimiento=TipoMovimientoFidelidad.ACREDITACION_PEDIDO,
        puntos=10,
        sellos=1,
        descripcion=None,
        created_at=datetime.now(timezone.utc),
    )
    return SimpleNamespace(**{**defaults, **overrides})


class FakeFidelidadService:
    def __init__(self, usuario_id=None):
        self._usuario_id = usuario_id or uuid4()

    def get_resumen(self, usuario_id):
        return ResumenFidelidad(
            usuario_id=usuario_id,
            puntos=0,
            sellos=0,
            movimientos=[],
        )

    def get_movimientos(self, usuario_id):
        return []

    def acreditar_por_pedido(self, usuario_id, pedido_id, total_pedido, descripcion=None):
        return _make_movimiento_ns(
            usuario_id=usuario_id,
            pedido_id=pedido_id,
            puntos=int(total_pedido),
            sellos=1,
        )


def teardown_function():
    app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# Fake repository para tests de servicio directo
# ---------------------------------------------------------------------------

class FakeFidelidadRepo:
    def __init__(self):
        self._movimientos = []

    def get_movimientos_by_usuario(self, usuario_id):
        return [m for m in self._movimientos if m.usuario_id == usuario_id]

    def get_acreditacion_by_pedido(self, pedido_id):
        return next(
            (
                m
                for m in self._movimientos
                if m.pedido_id == pedido_id
                and m.tipo_movimiento == TipoMovimientoFidelidad.ACREDITACION_PEDIDO
            ),
            None,
        )

    def create_movimiento(
        self, usuario_id, pedido_id, tipo_movimiento, puntos, sellos, descripcion
    ):
        m = _make_movimiento_ns(
            usuario_id=usuario_id,
            pedido_id=pedido_id,
            tipo_movimiento=tipo_movimiento,
            puntos=puntos,
            sellos=sellos,
            descripcion=descripcion,
        )
        self._movimientos.append(m)
        return m


# ---------------------------------------------------------------------------
# Test 1: health sigue funcionando
# ---------------------------------------------------------------------------

def test_health_sigue_funcionando():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


# ---------------------------------------------------------------------------
# Test 2: GET /fidelidad/me devuelve estructura esperada
# ---------------------------------------------------------------------------

def test_get_fidelidad_me_devuelve_estructura():
    usuario_id = uuid4()
    app.dependency_overrides[get_current_user] = lambda: SimpleNamespace(
        id=usuario_id, rol=UsuarioRol.ESTUDIANTE, activo=True
    )
    app.dependency_overrides[get_fidelidad_service] = lambda: FakeFidelidadService()

    response = client.get("/api/v1/fidelidad/me")

    assert response.status_code == 200
    data = response.json()
    assert "usuario_id" in data
    assert "puntos" in data
    assert "sellos" in data
    assert "movimientos" in data
    assert isinstance(data["movimientos"], list)
    assert data["puntos"] == 0
    assert data["sellos"] == 0


# ---------------------------------------------------------------------------
# Test 3: acreditar_por_pedido calcula puntos correctamente
# ---------------------------------------------------------------------------

def test_acreditar_calcula_puntos_correctamente():
    from app.services.fidelidad_service import FidelidadService

    repo = FakeFidelidadRepo()
    service = FidelidadService(repo)

    movimiento = service.acreditar_por_pedido(
        usuario_id=uuid4(),
        pedido_id=uuid4(),
        total_pedido=Decimal("75.90"),
    )

    assert movimiento.puntos == 75  # floor(75.90)


# ---------------------------------------------------------------------------
# Test 4: acreditar_por_pedido suma 1 sello
# ---------------------------------------------------------------------------

def test_acreditar_suma_1_sello():
    from app.services.fidelidad_service import FidelidadService

    repo = FakeFidelidadRepo()
    service = FidelidadService(repo)

    movimiento = service.acreditar_por_pedido(
        usuario_id=uuid4(),
        pedido_id=uuid4(),
        total_pedido=Decimal("30.00"),
    )

    assert movimiento.sellos == 1


# ---------------------------------------------------------------------------
# Test 5: acreditar_por_pedido no duplica si ya fue acreditado
# ---------------------------------------------------------------------------

def test_acreditar_no_duplica_mismo_pedido():
    from app.services.fidelidad_service import FidelidadService

    repo = FakeFidelidadRepo()
    service = FidelidadService(repo)

    usuario_id = uuid4()
    pedido_id = uuid4()

    m1 = service.acreditar_por_pedido(usuario_id, pedido_id, Decimal("50.00"))
    m2 = service.acreditar_por_pedido(usuario_id, pedido_id, Decimal("50.00"))

    assert m1.id == m2.id
    assert len(repo.get_movimientos_by_usuario(usuario_id)) == 1


# ---------------------------------------------------------------------------
# Test 6: schema rechaza puntos negativos en acreditacion normal
# ---------------------------------------------------------------------------

def test_schema_rechaza_puntos_negativos_en_acreditacion_normal():
    with pytest.raises(ValidationError):
        MovimientoFidelidadCreate(
            usuario_id=uuid4(),
            pedido_id=uuid4(),
            tipo_movimiento=TipoMovimientoFidelidad.ACREDITACION_PEDIDO,
            puntos=-5,
            sellos=1,
        )


# ---------------------------------------------------------------------------
# Test 7: schema exige pedido_id para ACREDITACION_PEDIDO
# ---------------------------------------------------------------------------

def test_schema_exige_pedido_id_para_acreditacion_pedido():
    with pytest.raises(ValidationError):
        MovimientoFidelidadCreate(
            usuario_id=uuid4(),
            pedido_id=None,
            tipo_movimiento=TipoMovimientoFidelidad.ACREDITACION_PEDIDO,
            puntos=10,
            sellos=1,
        )


# ---------------------------------------------------------------------------
# Test 8: ruta admin rechaza sin token
# ---------------------------------------------------------------------------

def test_ruta_acreditar_rechaza_sin_token():
    response = client.post(
        "/api/v1/fidelidad/acreditar",
        json={
            "usuario_id": str(uuid4()),
            "pedido_id": str(uuid4()),
            "total_pedido": "50.00",
        },
    )
    assert response.status_code == 401


# ---------------------------------------------------------------------------
# Test 9: ruta admin rechaza rol ESTUDIANTE
# ---------------------------------------------------------------------------

def test_ruta_acreditar_rechaza_rol_estudiante():
    app.dependency_overrides[get_current_user] = lambda: SimpleNamespace(
        id=uuid4(), rol=UsuarioRol.ESTUDIANTE, activo=True
    )
    app.dependency_overrides[get_fidelidad_service] = lambda: FakeFidelidadService()

    response = client.post(
        "/api/v1/fidelidad/acreditar",
        json={
            "usuario_id": str(uuid4()),
            "pedido_id": str(uuid4()),
            "total_pedido": "50.00",
        },
    )
    assert response.status_code == 403


# ---------------------------------------------------------------------------
# Test 10: ruta admin permite rol ADMIN
# ---------------------------------------------------------------------------

def test_ruta_acreditar_permite_rol_admin():
    app.dependency_overrides[get_current_user] = lambda: SimpleNamespace(
        id=uuid4(), rol=UsuarioRol.ADMIN, activo=True
    )
    app.dependency_overrides[get_fidelidad_service] = lambda: FakeFidelidadService()

    response = client.post(
        "/api/v1/fidelidad/acreditar",
        json={
            "usuario_id": str(uuid4()),
            "pedido_id": str(uuid4()),
            "total_pedido": "50.00",
        },
    )
    assert response.status_code == 201


# ---------------------------------------------------------------------------
# Test 11: schema permite puntos negativos para REVERSA
# ---------------------------------------------------------------------------

def test_schema_permite_puntos_negativos_en_reversa():
    m = MovimientoFidelidadCreate(
        usuario_id=uuid4(),
        pedido_id=None,
        tipo_movimiento=TipoMovimientoFidelidad.REVERSA,
        puntos=-10,
        sellos=-1,
    )
    assert m.puntos == -10
    assert m.sellos == -1
