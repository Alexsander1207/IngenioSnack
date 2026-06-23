from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.usuario import Usuario
from app.repositories.usuario_repository import UsuarioRepository
from app.schemas.auth_schema import Token, UserLogin, UserRead, UserRegister
from app.services.auth_service import AuthService


router = APIRouter(prefix="/auth", tags=["auth"])


def get_auth_service(db: Session = Depends(get_db)) -> AuthService:
    return AuthService(UsuarioRepository(db))


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register(
    payload: UserRegister,
    service: AuthService = Depends(get_auth_service),
):
    try:
        return service.register(payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post("/login", response_model=Token)
def login(
    payload: UserLogin,
    service: AuthService = Depends(get_auth_service),
):
    usuario = service.authenticate(payload)
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo o password incorrectos.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return Token(access_token=service.create_token_for_user(usuario))


@router.get("/me", response_model=UserRead)
def me(current_user: Usuario = Depends(get_current_user)):
    return current_user
