from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import require_role
from app.models.usuario import UsuarioRol
from app.repositories.usuario_repository import UsuarioRepository
from app.schemas.cliente_schema import ClienteEstudianteRead, estado_conducta


router = APIRouter(prefix="/clientes", tags=["clientes"])


@router.get(
    "/estudiantes",
    response_model=list[ClienteEstudianteRead],
    dependencies=[Depends(require_role(UsuarioRol.ADMIN))],
)
def list_estudiantes(db: Session = Depends(get_db)) -> list[ClienteEstudianteRead]:
    rows = UsuarioRepository(db).list_estudiantes_resumen()
    return [
        ClienteEstudianteRead(
            id=usuario.id,
            nombre=usuario.nombre,
            correo=usuario.correo,
            codigo_estudiante=usuario.codigo_estudiante,
            pedidos_realizados=pedidos_realizados,
            pedidos_no_recogidos=pedidos_no_recogidos,
            puntos=puntos,
            sellos=sellos,
            conducta_score=usuario.conducta_score,
            banned_until=usuario.banned_until,
            ban_reason=usuario.ban_reason,
            estado_conducta=estado_conducta(usuario.conducta_score, usuario.banned_until),
        )
        for usuario, pedidos_realizados, pedidos_no_recogidos, puntos, sellos in rows
    ]
