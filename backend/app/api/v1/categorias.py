from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import require_role
from app.models.usuario import UsuarioRol
from app.repositories.categoria_repository import CategoriaRepository
from app.schemas.categoria_schema import CategoriaCreate, CategoriaRead, CategoriaUpdate
from app.services.categoria_service import CategoriaService


router = APIRouter(prefix="/categorias", tags=["categorias"])


def get_categoria_service(db: Session = Depends(get_db)) -> CategoriaService:
    return CategoriaService(CategoriaRepository(db))


@router.get("", response_model=list[CategoriaRead])
def list_categorias(service: CategoriaService = Depends(get_categoria_service)) -> list:
    return service.list_categorias()


@router.get("/{categoria_id}", response_model=CategoriaRead)
def get_categoria(
    categoria_id: UUID,
    service: CategoriaService = Depends(get_categoria_service),
):
    categoria = service.get_categoria(categoria_id)
    if not categoria:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Categoria no encontrada.")
    return categoria


@router.post(
    "",
    response_model=CategoriaRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_role(UsuarioRol.ADMIN))],
)
def create_categoria(
    payload: CategoriaCreate,
    service: CategoriaService = Depends(get_categoria_service),
):
    try:
        return service.create_categoria(payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.put(
    "/{categoria_id}",
    response_model=CategoriaRead,
    dependencies=[Depends(require_role(UsuarioRol.ADMIN))],
)
def update_categoria(
    categoria_id: UUID,
    payload: CategoriaUpdate,
    service: CategoriaService = Depends(get_categoria_service),
):
    try:
        categoria = service.update_categoria(categoria_id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    if not categoria:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Categoria no encontrada.")
    return categoria


@router.delete(
    "/{categoria_id}",
    response_model=CategoriaRead,
    dependencies=[Depends(require_role(UsuarioRol.ADMIN))],
)
def delete_categoria(
    categoria_id: UUID,
    service: CategoriaService = Depends(get_categoria_service),
):
    categoria = service.delete_categoria(categoria_id)
    if not categoria:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Categoria no encontrada.")
    return categoria
