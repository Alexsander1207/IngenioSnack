"""
Tests: Promociones con pago mixto (dinero + puntos).
"""
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from types import SimpleNamespace
from uuid import uuid4

import pytest
from fastapi import HTTPException

from app.models.pedido import PedidoEstado
from app.schemas.pedido_schema import PedidoCreate, PedidoItemCreate
from app.services.pedido_service import PedidoService


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_promo(
    puntos_requeridos: int = 0,
    activo: bool = True,
    disponible: bool = True,
    vigente: bool = True,
    valor: Decimal = Decimal("3.00"),
):
    now = datetime.now(timezone.utc)
    return SimpleNamespace(
        id=uuid4(),
        nombre="Combo Test",
        descripcion="Promo de prueba",
        tipo="COMBO",
        valor=valor,
        puntos_requeridos=puntos_requeridos,
        activo=activo,
        disponible=disponible,
        fecha_inicio=now - timedelta(days=1) if vigente else now + timedelta(days=1),
        fecha_fin=now + timedelta(days=30) if vigente else now + timedelta(days=31),
        created_at=now,
        updated_at=now,
    )


class FakePromocionRepo:
    def __init__(self, promo=None):
        self._promo = promo

    def get(self, promocion_id):
        if self._promo and self._promo.id == promocion_id:
            return self._promo
        return None

    def list_vigentes(self):
        return [self._promo] if self._promo else []


class FakePedidoRepo:
    def __init__(self):
        self.pedido = None
        self.commits = 0
        self.rollbacks = 0

    def add(self, pedido, items):
        now = datetime.now(timezone.utc)
        pedido.id = uuid4()
        pedido.created_at = now
        pedido.updated_at = now
        for item in items:
            item.id = uuid4()
            item.pedido_id = pedido.id
        pedido.items = items
        self.pedido = pedido

    def add_stock_movimiento(self, **kwargs):
        pass

    def mark_stock_liberado(self, pedido):
        pedido.stock_liberado = True

    def get_usuario(self, usuario_id):
        return None

    def list_by_usuario(self, usuario_id):
        return []

    def list_all(self):
        return [self.pedido] if self.pedido else []

    def list_vencidos(self, limite):
        return []

    def get(self, pedido_id):
        if self.pedido and self.pedido.id == pedido_id:
            return self.pedido
        return None

    def set_estado(self, pedido, estado):
        pedido.estado = estado
        return pedido

    def mark_fidelidad_acreditada(self, pedido):
        pedido.fidelidad_acreditada = True

    def commit(self):
        self.commits += 1

    def rollback(self):
        self.rollbacks += 1

    def refresh(self, pedido):
        return pedido


class FakeFidelidadService:
    def __init__(self, saldo_puntos: int = 999):
        self.saldo_puntos = saldo_puntos
        self.deducidas = 0
        self.devueltas = 0
        self.acreditadas: list[int] = []

    def acreditar_por_pedido(self, usuario_id, pedido_id, total_pedido, descripcion=None):
        self.acreditadas.append(int(total_pedido))

    def deducir_puntos_promo(self, usuario_id, pedido_id, puntos, descripcion=None):
        if self.saldo_puntos < puntos:
            raise HTTPException(
                status_code=400,
                detail="Saldo de fidelidad insuficiente para realizar el canje.",
            )
        self.saldo_puntos -= puntos
        self.deducidas += puntos

    def devolver_puntos_promo(self, pedido_id):
        if self.deducidas > 0:
            self.saldo_puntos += self.deducidas
            self.devueltas += self.deducidas


def _build_service(promo=None, saldo_puntos=999, producto=None) -> tuple[PedidoService, FakeFidelidadService, FakePedidoRepo]:
    pedido_repo = FakePedidoRepo()
    fidelidad = FakeFidelidadService(saldo_puntos=saldo_puntos)
    promo_repo = FakePromocionRepo(promo)
    service = PedidoService(
        pedido_repository=pedido_repo,
        fidelidad_service=fidelidad,
        promocion_repository=promo_repo,
    )
    return service, fidelidad, pedido_repo


# ---------------------------------------------------------------------------
# ESCENARIO 1: Promo sin puntos — pedido OK
# ---------------------------------------------------------------------------

def test_pedido_con_promo_sin_puntos_funciona():
    promo = _make_promo(puntos_requeridos=0, valor=Decimal("5.00"))
    service, fidelidad, _ = _build_service(promo=promo)

    pedido = service.crear_pedido(
        uuid4(),
        PedidoCreate(items=[PedidoItemCreate(promocion_id=promo.id, cantidad=1)]),
    )

    assert pedido.total == Decimal("5.00")
    assert pedido.items[0].nombre_producto == "Combo Test"
    assert fidelidad.deducidas == 0


# ---------------------------------------------------------------------------
# ESCENARIO 2: Promo vencida — pedido falla 409
# ---------------------------------------------------------------------------

def test_pedido_con_promo_vencida_falla_409():
    promo = _make_promo(vigente=False)
    service, _, _ = _build_service(promo=promo)

    with pytest.raises(HTTPException) as exc:
        service.crear_pedido(
            uuid4(),
            PedidoCreate(items=[PedidoItemCreate(promocion_id=promo.id, cantidad=1)]),
        )

    assert exc.value.status_code == 409
    assert "vigente" in exc.value.detail.lower()


# ---------------------------------------------------------------------------
# ESCENARIO 3: Promo con puntos, sin puntos suficientes — falla 400
# ---------------------------------------------------------------------------

def test_pedido_promo_puntos_insuficientes_falla_400():
    promo = _make_promo(puntos_requeridos=50)
    service, fidelidad, pedido_repo = _build_service(promo=promo, saldo_puntos=10)

    with pytest.raises(HTTPException) as exc:
        service.crear_pedido(
            uuid4(),
            PedidoCreate(items=[PedidoItemCreate(promocion_id=promo.id, cantidad=1)]),
        )

    assert exc.value.status_code == 400
    assert pedido_repo.rollbacks == 1


# ---------------------------------------------------------------------------
# ESCENARIO 4: Promo con puntos, suficientes — descuenta puntos
# ---------------------------------------------------------------------------

def test_pedido_promo_descuenta_puntos_correctamente():
    promo = _make_promo(puntos_requeridos=50, valor=Decimal("3.00"))
    service, fidelidad, _ = _build_service(promo=promo, saldo_puntos=100)

    pedido = service.crear_pedido(
        uuid4(),
        PedidoCreate(items=[PedidoItemCreate(promocion_id=promo.id, cantidad=1)]),
    )

    assert pedido.total == Decimal("3.00")
    assert fidelidad.deducidas == 50
    assert fidelidad.saldo_puntos == 50


# ---------------------------------------------------------------------------
# ESCENARIO 5: Cantidad > 1 multiplica puntos requeridos
# ---------------------------------------------------------------------------

def test_pedido_promo_cantidad_multiplica_puntos():
    promo = _make_promo(puntos_requeridos=30, valor=Decimal("2.00"))
    service, fidelidad, _ = _build_service(promo=promo, saldo_puntos=200)

    pedido = service.crear_pedido(
        uuid4(),
        PedidoCreate(items=[PedidoItemCreate(promocion_id=promo.id, cantidad=3)]),
    )

    assert pedido.total == Decimal("6.00")
    assert fidelidad.deducidas == 90  # 30 pts x 3 unidades


# ---------------------------------------------------------------------------
# ESCENARIO 6: Cancelacion devuelve puntos
# ---------------------------------------------------------------------------

def test_cancelacion_devuelve_puntos_descontados():
    promo = _make_promo(puntos_requeridos=50, valor=Decimal("3.00"))
    service, fidelidad, _ = _build_service(promo=promo, saldo_puntos=100)

    pedido = service.crear_pedido(
        uuid4(),
        PedidoCreate(items=[PedidoItemCreate(promocion_id=promo.id, cantidad=1)]),
    )
    assert fidelidad.deducidas == 50

    service.cambiar_estado(pedido.id, PedidoEstado.CANCELADO)

    assert fidelidad.devueltas == 50
    assert fidelidad.saldo_puntos == 100  # saldo restaurado


# ---------------------------------------------------------------------------
# ESCENARIO 7: RECOGIDO acredita puntos sobre monto monetario (no puntos)
# ---------------------------------------------------------------------------

def test_recogido_acredita_puntos_sobre_monto_monetario():
    promo = _make_promo(puntos_requeridos=50, valor=Decimal("3.00"))
    service, fidelidad, _ = _build_service(promo=promo, saldo_puntos=100)

    pedido = service.crear_pedido(
        uuid4(),
        PedidoCreate(items=[PedidoItemCreate(promocion_id=promo.id, cantidad=1)]),
    )

    service.cambiar_estado(pedido.id, PedidoEstado.RECOGIDO)

    # Acredita sobre el total monetario pagado (S/3.00), no el precio original (S/5.00)
    assert len(fidelidad.acreditadas) == 1
    assert fidelidad.acreditadas[0] == 3


# ---------------------------------------------------------------------------
# ESCENARIO 8: PedidoItemCreate rechaza si no hay producto_id ni promocion_id
# ---------------------------------------------------------------------------

def test_pedido_item_sin_producto_ni_promo_falla_validacion():
    from pydantic import ValidationError

    with pytest.raises(ValidationError):
        PedidoItemCreate(cantidad=2)


# ---------------------------------------------------------------------------
# ESCENARIO 9: Promo no disponible — falla 409
# ---------------------------------------------------------------------------

def test_pedido_promo_no_disponible_falla_409():
    promo = _make_promo(disponible=False)
    service, _, _ = _build_service(promo=promo)

    with pytest.raises(HTTPException) as exc:
        service.crear_pedido(
            uuid4(),
            PedidoCreate(items=[PedidoItemCreate(promocion_id=promo.id, cantidad=1)]),
        )

    assert exc.value.status_code == 409
    assert "disponible" in exc.value.detail.lower()
