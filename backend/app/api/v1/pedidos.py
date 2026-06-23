from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models.pedido import PedidoEstado
from app.models.usuario import Usuario, UsuarioRol
from app.repositories.pedido_repository import PedidoRepository
from app.repositories.producto_repository import ProductoRepository
from app.schemas.pedido_schema import PedidoCreate, PedidoEstadoUpdate, PedidoRead
from app.services.pedido_service import PedidoService


router = APIRouter(prefix="/pedidos", tags=["pedidos"])


def get_pedido_service(db: Session = Depends(get_db)) -> PedidoService:
    return PedidoService(
        pedido_repository=PedidoRepository(db),
        producto_repository=ProductoRepository(db),
    )


@router.post("", response_model=PedidoRead, status_code=201)
def crear_pedido(
    payload: PedidoCreate,
    current_user: Usuario = Depends(get_current_user),
    service: PedidoService = Depends(get_pedido_service),
):
    return service.crear_pedido(current_user.id, payload)


@router.get("/mis-pedidos", response_model=list[PedidoRead])
def mis_pedidos(
    current_user: Usuario = Depends(get_current_user),
    service: PedidoService = Depends(get_pedido_service),
):
    return service.listar_mis_pedidos(current_user.id)


@router.get("/admin", response_model=list[PedidoRead])
def listar_admin(
    _admin: Usuario = Depends(require_role(UsuarioRol.ADMIN)),
    service: PedidoService = Depends(get_pedido_service),
):
    return service.listar_admin()


@router.get("/{pedido_id}", response_model=PedidoRead)
def obtener_pedido(
    pedido_id: UUID,
    current_user: Usuario = Depends(get_current_user),
    service: PedidoService = Depends(get_pedido_service),
):
    return service.obtener_pedido(
        pedido_id,
        usuario_id=current_user.id,
        is_admin=current_user.rol == UsuarioRol.ADMIN,
    )


@router.patch("/{pedido_id}/estado", response_model=PedidoRead)
def cambiar_estado(
    pedido_id: UUID,
    payload: PedidoEstadoUpdate,
    _admin: Usuario = Depends(require_role(UsuarioRol.ADMIN)),
    service: PedidoService = Depends(get_pedido_service),
):
    return service.cambiar_estado(pedido_id, PedidoEstado(payload.estado))
