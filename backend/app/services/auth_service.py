from datetime import timedelta

from app.core.config import settings
from app.core.security import create_access_token, get_password_hash, verify_password
from app.models.usuario import Usuario
from app.repositories.usuario_repository import UsuarioRepository
from app.schemas.auth_schema import UserLogin, UserRegister


class AuthService:
    def __init__(self, repository: UsuarioRepository) -> None:
        self.repository = repository

    def register(self, payload: UserRegister) -> Usuario:
        existing = self.repository.get_by_email(payload.correo)
        if existing:
            raise ValueError("El correo ya esta registrado.")

        return self.repository.create_student(
            nombre=payload.nombre,
            correo=str(payload.correo),
            codigo_estudiante=payload.codigo_estudiante,
            hashed_password=get_password_hash(payload.password),
        )

    def authenticate(self, payload: UserLogin) -> Usuario | None:
        usuario = self.repository.get_by_email(str(payload.correo))
        if not usuario or not verify_password(payload.password, usuario.hashed_password):
            return None
        if not usuario.activo:
            return None
        return usuario

    def create_token_for_user(self, usuario: Usuario) -> str:
        expires_delta = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        return create_access_token(
            subject=str(usuario.id),
            role=usuario.rol.value,
            expires_delta=expires_delta,
        )
