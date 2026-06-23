from uuid import UUID

from sqlalchemy import case, func, select
from sqlalchemy.orm import Session

from app.models.fidelidad import FidelidadMovimiento
from app.models.pedido import Pedido, PedidoEstado
from app.models.usuario import Usuario, UsuarioRol


class UsuarioRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, user_id: UUID) -> Usuario | None:
        return self.db.get(Usuario, user_id)

    def get_by_email(self, correo: str) -> Usuario | None:
        result = self.db.execute(select(Usuario).where(Usuario.correo == correo.lower()))
        return result.scalar_one_or_none()

    def list_estudiantes_resumen(self) -> list[tuple[Usuario, int, int, int, int]]:
        pedidos_total = func.coalesce(func.count(Pedido.id), 0).label("pedidos_total")
        pedidos_no_recogidos = func.coalesce(
            func.sum(
                case((Pedido.estado == PedidoEstado.NO_RECOGIDO, 1), else_=0)
            ),
            0,
        ).label("pedidos_no_recogidos")
        puntos_total = func.coalesce(func.sum(FidelidadMovimiento.puntos), 0).label("puntos")
        sellos_total = func.coalesce(func.sum(FidelidadMovimiento.sellos), 0).label("sellos")

        pedido_stats = (
            select(
                Pedido.usuario_id.label("usuario_id"),
                pedidos_total,
                pedidos_no_recogidos,
            )
            .group_by(Pedido.usuario_id)
            .subquery()
        )
        fidelidad_stats = (
            select(
                FidelidadMovimiento.usuario_id.label("usuario_id"),
                puntos_total,
                sellos_total,
            )
            .group_by(FidelidadMovimiento.usuario_id)
            .subquery()
        )

        result = self.db.execute(
            select(
                Usuario,
                func.coalesce(pedido_stats.c.pedidos_total, 0),
                func.coalesce(pedido_stats.c.pedidos_no_recogidos, 0),
                func.coalesce(fidelidad_stats.c.puntos, 0),
                func.coalesce(fidelidad_stats.c.sellos, 0),
            )
            .outerjoin(pedido_stats, pedido_stats.c.usuario_id == Usuario.id)
            .outerjoin(fidelidad_stats, fidelidad_stats.c.usuario_id == Usuario.id)
            .where(Usuario.rol == UsuarioRol.ESTUDIANTE)
            .order_by(Usuario.nombre.asc())
        )
        return [(row[0], int(row[1] or 0), int(row[2] or 0), int(row[3] or 0), int(row[4] or 0)) for row in result.all()]

    def create_student(
        self,
        *,
        nombre: str,
        correo: str,
        hashed_password: str,
        codigo_estudiante: str | None = None,
    ) -> Usuario:
        usuario = Usuario(
            nombre=nombre,
            correo=correo.lower(),
            codigo_estudiante=codigo_estudiante,
            hashed_password=hashed_password,
            rol=UsuarioRol.ESTUDIANTE,
        )
        self.db.add(usuario)
        self.db.commit()
        self.db.refresh(usuario)
        return usuario
