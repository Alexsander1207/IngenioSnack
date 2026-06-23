from uuid import UUID

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.usuario import Usuario
from app.repositories.favorito_producto_repository import FavoritoProductoRepository
from app.repositories.producto_repository import ProductoRepository
from app.schemas.producto_schema import FavoritoProductoRead
from app.services.favorito_producto_service import FavoritoProductoService


router = APIRouter(prefix="/favoritos/productos", tags=["favoritos"])


def get_favorito_producto_service(db: Session = Depends(get_db)) -> FavoritoProductoService:
    return FavoritoProductoService(
        FavoritoProductoRepository(db),
        ProductoRepository(db),
    )


@router.get("", response_model=list[FavoritoProductoRead])
def list_favoritos_productos(
    current_user: Usuario = Depends(get_current_user),
    service: FavoritoProductoService = Depends(get_favorito_producto_service),
):
    return service.list_favoritos(current_user.id)


@router.post(
    "/{producto_id}",
    response_model=FavoritoProductoRead,
    status_code=status.HTTP_201_CREATED,
)
def add_favorito_producto(
    producto_id: UUID,
    current_user: Usuario = Depends(get_current_user),
    service: FavoritoProductoService = Depends(get_favorito_producto_service),
):
    return service.add_favorito(current_user.id, producto_id)


@router.delete("/{producto_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_favorito_producto(
    producto_id: UUID,
    current_user: Usuario = Depends(get_current_user),
    service: FavoritoProductoService = Depends(get_favorito_producto_service),
):
    service.remove_favorito(current_user.id, producto_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
