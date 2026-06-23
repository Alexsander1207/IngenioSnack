from pathlib import Path

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.errors import ConfigurationError

_UPLOADS_DIR = Path(__file__).parent.parent.parent / "uploads"


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description="Backend FastAPI paralelo para IngenioSnack.",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(api_router, prefix=settings.API_V1_PREFIX)

    if _UPLOADS_DIR.exists():
        app.mount("/uploads", StaticFiles(directory=str(_UPLOADS_DIR)), name="uploads")

    @app.exception_handler(ConfigurationError)
    async def configuration_error_handler(
        _request: Request,
        exc: ConfigurationError,
    ) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"detail": str(exc)},
        )

    return app


app = create_app()
