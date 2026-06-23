from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import require_role
from app.models.pedido import PedidoEstado
from app.models.usuario import UsuarioRol
from app.repositories.reporte_repository import ReporteRepository
from app.schemas.reporte_schema import (
    FidelidadResponse,
    ProductosResponse,
    ResumenResponse,
    VentasResponse,
)
from app.services.reporte_service import ReporteService


router = APIRouter(
    prefix="/reportes",
    tags=["reportes"],
    dependencies=[Depends(require_role(UsuarioRol.ADMIN))],
)


def get_reporte_service(db: Session = Depends(get_db)) -> ReporteService:
    return ReporteService(ReporteRepository(db))


@router.get("/resumen", response_model=ResumenResponse)
def reporte_resumen(service: ReporteService = Depends(get_reporte_service)) -> ResumenResponse:
    return service.get_resumen()


@router.get("/ventas", response_model=VentasResponse)
def reporte_ventas(
    fecha_inicio: datetime | None = Query(None),
    fecha_fin: datetime | None = Query(None),
    estado: PedidoEstado | None = Query(None),
    service: ReporteService = Depends(get_reporte_service),
) -> VentasResponse:
    if fecha_inicio and fecha_fin and fecha_fin < fecha_inicio:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="fecha_fin no puede ser anterior a fecha_inicio.",
        )
    return service.get_ventas(fecha_inicio, fecha_fin, estado)


@router.get("/productos", response_model=ProductosResponse)
def reporte_productos(
    service: ReporteService = Depends(get_reporte_service),
) -> ProductosResponse:
    return service.get_productos()


@router.get("/fidelidad", response_model=FidelidadResponse)
def reporte_fidelidad(
    service: ReporteService = Depends(get_reporte_service),
) -> FidelidadResponse:
    return service.get_fidelidad()
