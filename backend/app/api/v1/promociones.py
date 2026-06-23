from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import require_role
from app.models.usuario import UsuarioRol
from app.repositories.promocion_repository import PromocionRepository
from app.schemas.promocion_schema import PromocionCreate, PromocionRead, PromocionUpdate
from app.services.promocion_service import PromocionService


router = APIRouter(prefix="/promociones", tags=["promociones"])


def get_promocion_service(db: Session = Depends(get_db)) -> PromocionService:
    return PromocionService(PromocionRepository(db))


@router.get("", response_model=list[PromocionRead])
def list_promociones(service: PromocionService = Depends(get_promocion_service)) -> list:
    return service.list_promociones()


# /activas and /vigentes must be declared before /{promocion_id} to avoid route shadowing
@router.get("/activas", response_model=list[PromocionRead])
def list_activas(service: PromocionService = Depends(get_promocion_service)) -> list:
    return service.list_activas()


@router.get("/vigentes", response_model=list[PromocionRead])
def list_vigentes(service: PromocionService = Depends(get_promocion_service)) -> list:
    return service.list_vigentes()


@router.get("/{promocion_id}", response_model=PromocionRead)
def get_promocion(
    promocion_id: UUID,
    service: PromocionService = Depends(get_promocion_service),
):
    promocion = service.get_promocion(promocion_id)
    if not promocion:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Promocion no encontrada.")
    return promocion


@router.post(
    "",
    response_model=PromocionRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_role(UsuarioRol.ADMIN))],
)
def create_promocion(
    payload: PromocionCreate,
    service: PromocionService = Depends(get_promocion_service),
):
    return service.create_promocion(payload)


@router.put(
    "/{promocion_id}",
    response_model=PromocionRead,
    dependencies=[Depends(require_role(UsuarioRol.ADMIN))],
)
def update_promocion(
    promocion_id: UUID,
    payload: PromocionUpdate,
    service: PromocionService = Depends(get_promocion_service),
):
    promocion = service.update_promocion(promocion_id, payload)
    if not promocion:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Promocion no encontrada.")
    return promocion


@router.delete(
    "/{promocion_id}",
    response_model=PromocionRead,
    dependencies=[Depends(require_role(UsuarioRol.ADMIN))],
)
def delete_promocion(
    promocion_id: UUID,
    service: PromocionService = Depends(get_promocion_service),
):
    promocion = service.delete_promocion(promocion_id)
    if not promocion:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Promocion no encontrada.")
    return promocion
