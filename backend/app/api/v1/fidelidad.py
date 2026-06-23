from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models.usuario import Usuario, UsuarioRol
from app.repositories.fidelidad_repository import FidelidadRepository
from app.schemas.fidelidad_schema import (
    AcreditarPedidoRequest,
    CanjearPremioRequest,
    CanjeResponse,
    FidelidadReglaCreate,
    FidelidadReglaRead,
    FidelidadReglaUpdate,
    MovimientoFidelidadRead,
    RankingFidelidadItem,
    ResumenFidelidad,
)
from app.services.fidelidad_service import FidelidadService

router = APIRouter(prefix="/fidelidad", tags=["fidelidad"])
legacy_estudiante_router = APIRouter(prefix="/estudiante", tags=["fidelidad"])


def get_fidelidad_service(db: Session = Depends(get_db)) -> FidelidadService:
    return FidelidadService(FidelidadRepository(db))


def _assert_self_or_admin(current_user: Usuario, usuario_id: UUID) -> None:
    if current_user.rol != UsuarioRol.ADMIN and current_user.id != usuario_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No puedes operar la fidelidad de otro usuario.",
        )


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


@router.get("/ranking", response_model=list[RankingFidelidadItem])
def get_ranking_fidelidad(
    _current_user: Usuario = Depends(get_current_user),
    service: FidelidadService = Depends(get_fidelidad_service),
) -> list[RankingFidelidadItem]:
    return service.get_ranking()


@router.get(
    "/reglas",
    response_model=list[FidelidadReglaRead],
    dependencies=[Depends(require_role(UsuarioRol.ADMIN))],
)
def get_reglas_fidelidad(
    service: FidelidadService = Depends(get_fidelidad_service),
) -> list[FidelidadReglaRead]:
    return service.list_reglas()


@router.post(
    "/reglas",
    response_model=FidelidadReglaRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_role(UsuarioRol.ADMIN))],
)
def create_regla_fidelidad(
    payload: FidelidadReglaCreate,
    service: FidelidadService = Depends(get_fidelidad_service),
) -> FidelidadReglaRead:
    return service.create_regla(payload)


@router.put(
    "/reglas/{regla_id}",
    response_model=FidelidadReglaRead,
    dependencies=[Depends(require_role(UsuarioRol.ADMIN))],
)
def update_regla_fidelidad(
    regla_id: UUID,
    payload: FidelidadReglaUpdate,
    service: FidelidadService = Depends(get_fidelidad_service),
) -> FidelidadReglaRead:
    return service.update_regla(regla_id, payload)


@router.post("/canjear-premio", response_model=CanjeResponse)
def canjear_premio(
    payload: CanjearPremioRequest,
    current_user: Usuario = Depends(get_current_user),
    service: FidelidadService = Depends(get_fidelidad_service),
) -> CanjeResponse:
    usuario_id = payload.usuario_id or current_user.id
    _assert_self_or_admin(current_user, usuario_id)
    return service.canjear_premio(usuario_id, payload)


@router.post("/canjear-cafe", response_model=CanjeResponse)
def canjear_cafe(
    current_user: Usuario = Depends(get_current_user),
    service: FidelidadService = Depends(get_fidelidad_service),
) -> CanjeResponse:
    return service.canjear_cafe(current_user.id)


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


@legacy_estudiante_router.post("/{usuario_id}/canjear-cafe", response_model=CanjeResponse)
def canjear_cafe_compat_estudiante(
    usuario_id: UUID,
    current_user: Usuario = Depends(get_current_user),
    service: FidelidadService = Depends(get_fidelidad_service),
) -> CanjeResponse:
    _assert_self_or_admin(current_user, usuario_id)
    return service.canjear_cafe(usuario_id)
