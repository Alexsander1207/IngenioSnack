from collections.abc import Generator

from sqlalchemy import Engine, create_engine, text
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import Settings, settings
from app.core.errors import ConfigurationError


class Base(DeclarativeBase):
    pass


def get_database_url(config: Settings = settings) -> str:
    if not config.database_configured:
        raise ConfigurationError(
            "DATABASE_URL is not configured. Define it in backend/.env before using database features."
        )
    return config.DATABASE_URL.strip()


def create_database_engine(config: Settings = settings) -> Engine:
    return create_engine(
        get_database_url(config),
        pool_pre_ping=True,
        future=True,
    )


def create_session_factory(config: Settings = settings) -> sessionmaker[Session]:
    return sessionmaker(
        bind=create_database_engine(config),
        autoflush=False,
        autocommit=False,
        expire_on_commit=False,
    )


def get_db() -> Generator[Session, None, None]:
    session_factory = create_session_factory()
    db = session_factory()
    try:
        yield db
    finally:
        db.close()


def check_database_connection(config: Settings = settings) -> bool:
    engine = create_database_engine(config)
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))
    return True
