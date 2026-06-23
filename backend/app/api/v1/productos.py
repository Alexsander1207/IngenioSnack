from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import require_role
from app.models.usuario import UsuarioRol
from app.repositories.producto_repository import ProductoRepository
from app.schemas.producto_schema import ProductoCreate, ProductoRead, ProductoUpdate
from app.services.producto_service import ProductoService


router = APIRouter(prefix="/productos", tags=["productos"])


def get_producto_service(db: Session = Depends(get_db)) -> ProductoService:
    return ProductoService(ProductoRepository(db))


@router.get("", response_model=list[ProductoRead])
def list_productos(service: ProductoService = Depends(get_producto_service)) -> list:
    return service.list_productos()


@router.get("/{producto_id}", response_model=ProductoRead)
def get_producto(
    producto_id: UUID,
    service: ProductoService = Depends(get_producto_service),
):
    producto = service.get_producto(producto_id)
    if not producto:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado.")
    return producto


@router.post(
    "",
    response_model=ProductoRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_role(UsuarioRol.ADMIN))],
)
def create_producto(
    payload: ProductoCreate,
    service: ProductoService = Depends(get_producto_service),
):
    return service.create_producto(payload)


@router.put(
    "/{producto_id}",
    response_model=ProductoRead,
    dependencies=[Depends(require_role(UsuarioRol.ADMIN))],
)
def update_producto(
    producto_id: UUID,
    payload: ProductoUpdate,
    service: ProductoService = Depends(get_producto_service),
):
    producto = service.update_producto(producto_id, payload)
    if not producto:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado.")
    return producto


@router.delete(
    "/{producto_id}",
    response_model=ProductoRead,
    dependencies=[Depends(require_role(UsuarioRol.ADMIN))],
)
def delete_producto(
    producto_id: UUID,
    service: ProductoService = Depends(get_producto_service),
):
    producto = service.delete_producto(producto_id)
    if not producto:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado.")
    return producto
