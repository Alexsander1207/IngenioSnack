from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models.usuario import Usuario, UsuarioRol
from app.repositories.fidelidad_repository import FidelidadRepository
from app.schemas.fidelidad_schema import (
    AcreditarPedidoRequest,
    MovimientoFidelidadRead,
    ResumenFidelidad,
)
from app.services.fidelidad_service import FidelidadService

router = APIRouter(prefix="/fidelidad", tags=["fidelidad"])


def get_fidelidad_service(db: Session = Depends(get_db)) -> FidelidadService:
    return FidelidadService(FidelidadRepository(db))


@router.get("/me", response_model=ResumenFidelidad)
def get_mi_fidelidad(
    current_user: Usuario = Depends(get_current_user),
    service: FidelidadService = Depends(get_fidelidad_service),
) -> ResumenFidelidad:
    return service.get_resumen(current_user.id)


@router.get("/movimientos", response_model=list[MovimientoFidelidadRead])
def get_mis_movimientos(
    current_user: Usuario = Depends(get_current_user),
    service: FidelidadService = Depends(get_fidelidad_service),
) -> list:
    return service.get_movimientos(current_user.id)


@router.get(
    "/usuario/{usuario_id}",
    response_model=ResumenFidelidad,
    dependencies=[Depends(require_role(UsuarioRol.ADMIN))],
)
def get_fidelidad_usuario(
    usuario_id: UUID,
    service: FidelidadService = Depends(get_fidelidad_service),
) -> ResumenFidelidad:
    return service.get_resumen(usuario_id)


@router.post(
    "/acreditar",
    response_model=MovimientoFidelidadRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_role(UsuarioRol.ADMIN))],
)
def acreditar_pedido(
    payload: AcreditarPedidoRequest,
    service: FidelidadService = Depends(get_fidelidad_service),
) -> MovimientoFidelidadRead:
    return service.acreditar_por_pedido(
        usuario_id=payload.usuario_id,
        pedido_id=payload.pedido_id,
        total_pedido=payload.total_pedido,
        descripcion=payload.descripcion,
    )
