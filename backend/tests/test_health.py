from fastapi.testclient import TestClient

from app.core.config import Settings
from app.main import app


client = TestClient(app)


def test_health_check() -> None:
    response = client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "service": "IngenioSnack API",
        "version": "1.0.0",
    }


def test_health_config_does_not_expose_database_url() -> None:
    response = client.get("/api/v1/health/config")

    assert response.status_code == 200
    payload = response.json()
    assert payload["service"] == "IngenioSnack API"
    assert "DATABASE_URL" not in payload
    assert "database_url" not in payload


def test_settings_defaults_load_without_database_url() -> None:
    settings = Settings(_env_file=None)

    assert settings.APP_NAME == "IngenioSnack API"
    assert settings.APP_VERSION == "1.0.0"
    assert settings.ENVIRONMENT == "development"
    assert settings.database_configured is False
    assert "http://localhost:5173" in settings.cors_origins_list
