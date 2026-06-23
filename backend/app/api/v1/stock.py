from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import require_role
from app.models.usuario import UsuarioRol
from app.repositories.producto_repository import ProductoRepository
from app.repositories.stock_repository import StockRepository
from app.schemas.stock_schema import MovimientoCreate, MovimientoRead, StockAlertaRead, StockItem
from app.services.stock_service import StockService

router = APIRouter(prefix="/stock", tags=["stock"])


def get_stock_service(db: Session = Depends(get_db)) -> StockService:
    return StockService(StockRepository(db), ProductoRepository(db))


@router.get("", response_model=list[StockItem])
def list_stock(service: StockService = Depends(get_stock_service)) -> list:
    return service.list_stock()


@router.get("/movimientos", response_model=list[MovimientoRead])
def list_movimientos(service: StockService = Depends(get_stock_service)) -> list:
    return service.list_movimientos()


@router.get(
    "/alertas",
    response_model=list[StockAlertaRead],
    dependencies=[Depends(require_role(UsuarioRol.ADMIN))],
)
def list_alertas_stock(service: StockService = Depends(get_stock_service)) -> list[StockAlertaRead]:
    return service.list_alertas()


@router.get("/producto/{producto_id}", response_model=list[MovimientoRead])
def list_movimientos_por_producto(
    producto_id: UUID,
    service: StockService = Depends(get_stock_service),
) -> list:
    return service.list_movimientos_por_producto(producto_id)


@router.post(
    "/movimientos",
    response_model=MovimientoRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_role(UsuarioRol.ADMIN))],
)
def crear_movimiento(
    payload: MovimientoCreate,
    service: StockService = Depends(get_stock_service),
) -> MovimientoRead:
    try:
        return service.crear_movimiento(payload)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc
