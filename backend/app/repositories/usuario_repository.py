from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.usuario import Usuario, UsuarioRol


class UsuarioRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, user_id: UUID) -> Usuario | None:
        return self.db.get(Usuario, user_id)

    def get_by_email(self, correo: str) -> Usuario | None:
        result = self.db.execute(select(Usuario).where(Usuario.correo == correo.lower()))
        return result.scalar_one_or_none()

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
