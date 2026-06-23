from datetime import datetime, timezone
from types import SimpleNamespace
from uuid import uuid4

from fastapi.testclient import TestClient

from app.api.v1.auth import get_auth_service
from app.core.security import create_access_token, get_current_user, get_password_hash, verify_password
from app.main import app
from app.models.usuario import UsuarioRol


client = TestClient(app)


class FakeAuthService:
    def __init__(self) -> None:
        self.usuario = SimpleNamespace(
            id=uuid4(),
            nombre="Ana Quispe",
            correo="ana@uncp.edu.pe",
            codigo_estudiante="ANA",
            rol=UsuarioRol.ESTUDIANTE,
            activo=True,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )

    def authenticate(self, payload):
        if payload.correo == "ana@uncp.edu.pe" and payload.password == "password123":
            return self.usuario
        return None

    def create_token_for_user(self, usuario):
        return create_access_token(subject=str(usuario.id), role=usuario.rol.value)


def teardown_function():
    app.dependency_overrides.clear()


def test_password_is_hashed_and_not_plain_text():
    hashed = get_password_hash("password123")

    assert hashed != "password123"
    assert verify_password("password123", hashed)


def test_login_generates_token_without_real_database():
    app.dependency_overrides[get_auth_service] = lambda: FakeAuthService()

    response = client.post(
        "/api/v1/auth/login",
        json={"correo": "ana@uncp.edu.pe", "password": "password123"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["token_type"] == "bearer"
    assert isinstance(payload["access_token"], str)
    assert len(payload["access_token"]) > 20


def test_auth_me_uses_bearer_dependency_override():
    fake_user = SimpleNamespace(
        id=uuid4(),
        nombre="Ana Quispe",
        correo="ana@uncp.edu.pe",
        codigo_estudiante="ANA",
        rol=UsuarioRol.ESTUDIANTE,
        activo=True,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    app.dependency_overrides[get_current_user] = lambda: fake_user

    response = client.get("/api/v1/auth/me", headers={"Authorization": "Bearer fake"})

    assert response.status_code == 200
    assert response.json()["correo"] == "ana@uncp.edu.pe"
