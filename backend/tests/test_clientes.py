from types import SimpleNamespace
from uuid import uuid4

from fastapi.testclient import TestClient

from app.api.v1.clientes import list_estudiantes
from app.core.database import get_db
from app.core.security import get_current_user
from app.main import app
from app.models.usuario import UsuarioRol


client = TestClient(app)


def teardown_function():
    app.dependency_overrides.clear()


def test_clientes_estudiantes_no_expone_password():
    usuario = SimpleNamespace(
        id=uuid4(),
        nombre="Ana",
        correo="ana@demo.test",
        codigo_estudiante="A001",
        conducta_score=100,
        banned_until=None,
        ban_reason=None,
        hashed_password="secret",
    )

    class FakeRepo:
        def list_estudiantes_resumen(self):
            return [(usuario, 2, 0, 10, 1)]

    app.dependency_overrides[get_current_user] = lambda: SimpleNamespace(
        id=uuid4(),
        rol=UsuarioRol.ADMIN,
        activo=True,
    )
    app.dependency_overrides[get_db] = lambda: iter([SimpleNamespace()])

    original = list_estudiantes.__globals__["UsuarioRepository"]
    list_estudiantes.__globals__["UsuarioRepository"] = lambda db: FakeRepo()
    try:
        response = client.get("/api/v1/clientes/estudiantes")
    finally:
        list_estudiantes.__globals__["UsuarioRepository"] = original

    assert response.status_code == 200
    data = response.json()[0]
    assert data["correo"] == "ana@demo.test"
    assert "hashed_password" not in data
