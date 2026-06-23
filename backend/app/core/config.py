from functools import lru_cache
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "IngenioSnack API"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: Literal["development", "test", "staging", "production"] = "development"
    API_V1_PREFIX: str = "/api/v1"
    DATABASE_URL: str | None = None
    SECRET_KEY: str = "change_me_in_production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    ALGORITHM: str = "HS256"
    CORS_ORIGINS: str = Field(
        default="http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000"
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def cors_origins_list(self) -> list[str]:
        value = self.CORS_ORIGINS.strip()
        if value.startswith("[") and value.endswith("]"):
            value = value[1:-1]
        return [
            origin.strip().strip('"').strip("'")
            for origin in value.split(",")
            if origin.strip()
        ]

    @property
    def database_configured(self) -> bool:
        return bool(self.DATABASE_URL and self.DATABASE_URL.strip())

    @property
    def safe_database_driver(self) -> str | None:
        if not self.database_configured:
            return None
        return self.DATABASE_URL.split("://", 1)[0]

    @property
    def PROJECT_NAME(self) -> str:
        return self.APP_NAME

    @property
    def VERSION(self) -> str:
        return self.APP_VERSION


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
