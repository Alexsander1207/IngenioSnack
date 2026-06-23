from fastapi import APIRouter

from app.core.config import settings


router = APIRouter()


@router.get("/health")
def health_check() -> dict[str, str]:
    return {
        "status": "ok",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
    }


@router.get("/health/config")
def health_config() -> dict[str, str | bool | list[str] | None]:
    return {
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "database_configured": settings.database_configured,
        "database_driver": settings.safe_database_driver,
        "cors_origins": settings.cors_origins_list,
    }
