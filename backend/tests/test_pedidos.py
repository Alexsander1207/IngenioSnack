from datetime import datetime, timezone
from decimal import Decimal
from types import SimpleNamespace
from uuid import uuid4

from fastapi.testclient import TestClient

from app.api.v1.pedidos import get_pedido_service
from app.core.security import get_current_user
from app.main import app
from app.models.pedido import PedidoEstado
from app.models.usuario import UsuarioRol
from app.schemas.pedido_schema import PedidoCreate, PedidoItemCreate
from app.services.pedido_service import PedidoService


client = TestClient(app)


def _pedido_read(usuario_id=None):
    pedido_id = uuid4()
    producto_id = uuid4()
    now = datetime.now(timezone.utc)
    return SimpleNamespace(
        id=pedido_id,
        codigo="PED-TEST",
        usuario_id=usuario_id or uuid4(),
        estado=PedidoEstado.PENDIENTE,
        subtotal=Decimal("10.00"),
        descuento=Decimal("0.00"),
        total=Decimal("10.00"),
        fidelidad_acreditada=False,
        created_at=now,
        updated_at=now,
        items=[
            SimpleNamespace(
                id=uuid4(),
                pedido_id=pedido_id,
                producto_id=producto_id,
                promocion_id=None,
                nombre_producto="Cafe",
                precio_unitario=Decimal("5.00"),
                cantidad=2,
                subtotal=Decimal("10.00"),
            )
        ],
    )


class FakePedidoApiService:
    def __init__(self) -> None:
        self.pedido = _pedido_read()

    def crear_pedido(self, usuario_id, payload):
        self.pedido.usuario_id = usuario_id
        return self.pedido

    def listar_mis_pedidos(self, usuario_id):
        return []

    def listar_admin(self):
        return [self.pedido]

    def obtener_pedido(self, pedido_id, usuario_id=None, is_admin=False):
        return self.pedido

    def cambiar_estado(self, pedido_id, nuevo_estado):
        self.pedido.estado = nuevo_estado
        return self.pedido


class FakeProductoRepo:
    def __init__(self, producto) -> None:
        self.producto = producto

    def get(self, producto_id):
        if producto_id == self.producto.id:
            return self.producto
        return None


class FakePedidoRepo:
    def __init__(self) -> None:
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
        return pedido

    def list_by_usuario(self, usuario_id):
        return []

    def list_all(self):
        return [self.pedido] if self.pedido else []

    def get(self, pedido_id):
        if self.pedido and self.pedido.id == pedido_id:
            return self.pedido
        return None

    def set_estado(self, pedido, estado):
        pedido.estado = estado
        pedido.updated_at = datetime.now(timezone.utc)
        return pedido

    def mark_fidelidad_acreditada(self, pedido):
        pedido.fidelidad_acreditada = True
        return pedido

    def commit(self):
        self.commits += 1

    def rollback(self):
        self.rollbacks += 1

    def refresh(self, pedido):
        return pedido


class FakeFidelidadService:
    def __init__(self) -> None:
        self.calls = 0

    def acreditar_por_pedido(self, pedido):
        self.calls += 1


def teardown_function():
    app.dependency_overrides.clear()


def test_crear_pedido_rechaza_items_vacios():
    app.dependency_overrides[get_current_user] = lambda: SimpleNamespace(
        id=uuid4(),
        rol=UsuarioRol.ESTUDIANTE,
        activo=True,
    )
    app.dependency_overrides[get_pedido_service] = lambda: FakePedidoApiService()

    response = client.post("/api/v1/pedidos", json={"items": []})

    assert response.status_code == 422


def test_crear_pedido_rechaza_cantidad_menor_o_igual_a_cero_con_schema():
    app.dependency_overrides[get_current_user] = lambda: SimpleNamespace(
        id=uuid4(),
        rol=UsuarioRol.ESTUDIANTE,
        activo=True,
    )
    app.dependency_overrides[get_pedido_service] = lambda: FakePedidoApiService()

    response = client.post(
        "/api/v1/pedidos",
        json={"items": [{"producto_id": str(uuid4()), "cantidad": 0}]},
    )

    assert response.status_code == 422


def test_crear_pedido_calcula_subtotal_y_total_con_producto_mock():
    producto = SimpleNamespace(
        id=uuid4(),
        nombre="Cafe",
        precio=Decimal("4.50"),
        stock=10,
        activo=True,
    )
    pedido_repo = FakePedidoRepo()
    service = PedidoService(pedido_repo, FakeProductoRepo(producto))

    pedido = service.crear_pedido(
        uuid4(),
        PedidoCreate(items=[PedidoItemCreate(producto_id=producto.id, cantidad=2)]),
    )

    assert pedido.subtotal == Decimal("9.00")
    assert pedido.total == Decimal("9.00")
    assert pedido.items[0].subtotal == Decimal("9.00")
    assert producto.stock == 8


def test_mis_pedidos_devuelve_lista():
    app.dependency_overrides[get_current_user] = lambda: SimpleNamespace(
        id=uuid4(),
        rol=UsuarioRol.ESTUDIANTE,
        activo=True,
    )
    app.dependency_overrides[get_pedido_service] = lambda: FakePedidoApiService()

    response = client.get("/api/v1/pedidos/mis-pedidos")

    assert response.status_code == 200
    assert response.json() == []


def test_pedidos_admin_rechaza_sin_token():
    response = client.get("/api/v1/pedidos/admin")

    assert response.status_code == 401


def test_pedidos_admin_rechaza_rol_estudiante():
    app.dependency_overrides[get_current_user] = lambda: SimpleNamespace(
        id=uuid4(),
        rol=UsuarioRol.ESTUDIANTE,
        activo=True,
    )
    app.dependency_overrides[get_pedido_service] = lambda: FakePedidoApiService()

    response = client.get("/api/v1/pedidos/admin")

    assert response.status_code == 403


def test_cambio_a_recogido_no_acredita_fidelidad_dos_veces():
    producto = SimpleNamespace(
        id=uuid4(),
        nombre="Cafe",
        precio=Decimal("5.00"),
        stock=10,
        activo=True,
    )
    pedido_repo = FakePedidoRepo()
    fidelidad = FakeFidelidadService()
    service = PedidoService(pedido_repo, FakeProductoRepo(producto), fidelidad)
    pedido = service.crear_pedido(
        uuid4(),
        PedidoCreate(items=[PedidoItemCreate(producto_id=producto.id, cantidad=1)]),
    )

    service.cambiar_estado(pedido.id, PedidoEstado.RECOGIDO)
    service.cambiar_estado(pedido.id, PedidoEstado.RECOGIDO)

    assert fidelidad.calls == 1
    assert pedido.fidelidad_acreditada is True


def test_estado_invalido_es_rechazado():
    app.dependency_overrides[get_current_user] = lambda: SimpleNamespace(
        id=uuid4(),
        rol=UsuarioRol.ADMIN,
        activo=True,
    )
    app.dependency_overrides[get_pedido_service] = lambda: FakePedidoApiService()

    response = client.patch(
        f"/api/v1/pedidos/{uuid4()}/estado",
        json={"estado": "VOLANDO"},
    )

    assert response.status_code == 422
