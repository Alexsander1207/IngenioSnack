from datetime import datetime, timezone
from uuid import UUID

from pydantic import BaseModel


class ClienteEstudianteRead(BaseModel):
    id: UUID
    nombre: str
    correo: str
    codigo_estudiante: str | None = None
    pedidos_realizados: int
    pedidos_no_recogidos: int
    puntos: int
    sellos: int
    conducta_score: int
    banned_until: datetime | None = None
    ban_reason: str | None = None
    estado_conducta: str


def estado_conducta(conducta_score: int, banned_until: datetime | None) -> str:
    now = datetime.now(timezone.utc)
    if banned_until:
        banned = banned_until
        if banned.tzinfo is None:
            banned = banned.replace(tzinfo=timezone.utc)
        if banned > now:
            return "baneado"
    if conducta_score >= 80:
        return "buena"
    if conducta_score >= 50:
        return "media"
    return "mala"
