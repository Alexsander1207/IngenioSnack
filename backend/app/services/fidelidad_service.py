import math
from decimal import Decimal
from uuid import UUID

from fastapi import HTTPException, status

from app.models.fidelidad import FidelidadMovimiento, TipoMovimientoFidelidad
from app.repositories.fidelidad_repository import FidelidadRepository
from app.schemas.fidelidad_schema import (
    CanjearPremioRequest,
    CanjeResponse,
    FidelidadReglaCreate,
    FidelidadReglaRead,
    FidelidadReglaUpdate,
    MovimientoFidelidadCreate,
    RankingFidelidadItem,
    ResumenFidelidad,
)


class FidelidadService:
    def __init__(self, repo: FidelidadRepository) -> None:
        self.repo = repo

    def get_resumen(self, usuario_id: UUID) -> ResumenFidelidad:
        movimientos = self.repo.get_movimientos_by_usuario(usuario_id)
        puntos = sum(m.puntos for m in movimientos)
        sellos = sum(m.sellos for m in movimientos)
        regla = self.repo.get_regla_activa_principal()
        sellos_canje_cafe = regla.sellos_canje_cafe if regla else 10
        puntos_por_sol = regla.puntos_por_sol if regla else Decimal("1.00")
        sellos_por_pedido = regla.sellos_por_pedido if regla else 1
        cafes_gratis = sellos // sellos_canje_cafe if sellos_canje_cafe > 0 else 0
        return ResumenFidelidad(
            usuario_id=usuario_id,
            puntos=puntos,
            sellos=sellos,
            sandwiches=sellos,
            cafesGratis=cafes_gratis,
            sellosObjetivo=sellos_canje_cafe,
            puntosPorSol=puntos_por_sol,
            sellosPorPedido=sellos_por_pedido,
            premiosDinamicos=[],
            movimientos=movimientos,
        )

    def get_movimientos(self, usuario_id: UUID) -> list[FidelidadMovimiento]:
        return self.repo.get_movimientos_by_usuario(usuario_id)

    def get_ranking(self) -> list[RankingFidelidadItem]:
        return [
            RankingFidelidadItem(
                id=usuario.id,
                nombre=usuario.nombre,
                correo=usuario.correo,
                codigo=usuario.codigo_estudiante,
                puntos=max(puntos, 0),
                sellos=max(sellos, 0),
                sandwiches=max(sellos, 0),
            )
            for usuario, puntos, sellos in self.repo.get_ranking()
        ]

    def list_reglas(self) -> list[FidelidadReglaRead]:
        return [FidelidadReglaRead.model_validate(regla) for regla in self.repo.list_reglas()]

    def create_regla(self, payload: FidelidadReglaCreate):
        return self.repo.create_regla(**payload.model_dump())

    def update_regla(self, regla_id: UUID, payload: FidelidadReglaUpdate):
        regla = self.repo.get_regla_by_id(regla_id)
        if regla is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Regla de fidelidad no encontrada.",
            )
        values = payload.model_dump(exclude_unset=True)
        return self.repo.update_regla(regla, values)

    def acreditar_por_pedido(
        self,
        usuario_id: UUID,
        pedido_id: UUID,
        total_pedido: Decimal,
        descripcion: str | None = None,
    ) -> FidelidadMovimiento:
        """
        Acredita puntos y sellos por un pedido recogido (solo monto monetario).

        Idempotente: si ya existe una ACREDITACION_PEDIDO para este pedido_id,
        retorna el movimiento existente sin crear duplicado.
        """
        existing = self.repo.get_acreditacion_by_pedido(pedido_id)
        if existing:
            return existing

        regla = self.repo.get_regla_activa_principal()
        puntos_por_sol = regla.puntos_por_sol if regla else Decimal("1")
        sellos_por_pedido = regla.sellos_por_pedido if regla else 1
        puntos = math.floor(float(total_pedido * puntos_por_sol))

        return self.repo.create_movimiento(
            usuario_id=usuario_id,
            pedido_id=pedido_id,
            tipo_movimiento=TipoMovimientoFidelidad.ACREDITACION_PEDIDO,
            puntos=puntos,
            sellos=sellos_por_pedido,
            descripcion=descripcion or f"Acreditacion por pedido {pedido_id}",
        )

    def deducir_puntos_promo(
        self,
        usuario_id: UUID,
        pedido_id: UUID,
        puntos: int,
        descripcion: str | None = None,
    ) -> FidelidadMovimiento:
        """Descuenta puntos al crear un pedido con promo que los requiere."""
        self._validar_saldo(usuario_id, puntos, 0)
        return self.repo.create_movimiento(
            usuario_id=usuario_id,
            pedido_id=pedido_id,
            tipo_movimiento=TipoMovimientoFidelidad.CANJE_PROMOCION,
            puntos=-puntos,
            sellos=0,
            descripcion=descripcion or f"Canje de {puntos} puntos por promocion",
        )

    def devolver_puntos_promo(self, pedido_id: UUID) -> int:
        """Devuelve puntos descontados al cancelar un pedido. Idempotente."""
        if self.repo.get_reversa_por_pedido(pedido_id):
            return 0
        canjes = self.repo.get_canjes_promo_por_pedido(pedido_id)
        if not canjes:
            return 0
        total_puntos = sum(-c.puntos for c in canjes)
        if total_puntos <= 0:
            return 0
        usuario_id = canjes[0].usuario_id
        self.repo.create_movimiento(
            usuario_id=usuario_id,
            pedido_id=pedido_id,
            tipo_movimiento=TipoMovimientoFidelidad.REVERSA,
            puntos=total_puntos,
            sellos=0,
            descripcion="Devolucion de puntos por cancelacion de pedido",
        )
        return total_puntos

    def crear_movimiento_admin(
        self, payload: MovimientoFidelidadCreate
    ) -> FidelidadMovimiento:
        return self.repo.create_movimiento(
            usuario_id=payload.usuario_id,
            pedido_id=payload.pedido_id,
            tipo_movimiento=payload.tipo_movimiento,
            puntos=payload.puntos,
            sellos=payload.sellos,
            descripcion=payload.descripcion,
        )

    def canjear_premio(self, usuario_id: UUID, payload: CanjearPremioRequest) -> CanjeResponse:
        puntos_requeridos = payload.puntos
        sellos_requeridos = payload.sellos

        if payload.regla_id and puntos_requeridos == 0 and sellos_requeridos == 0:
            regla = self.repo.get_regla_by_id(payload.regla_id)
            if regla is None:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Regla de fidelidad no encontrada.",
                )
            puntos_requeridos = regla.puntos_canje_cafe
            sellos_requeridos = regla.cantidad_criterio or regla.sellos_canje_cafe

        if puntos_requeridos == 0 and sellos_requeridos == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Debe indicar puntos o sellos a canjear.",
            )

        self._validar_saldo(usuario_id, puntos_requeridos, sellos_requeridos)
        movimiento = self.repo.create_movimiento(
            usuario_id=usuario_id,
            pedido_id=None,
            tipo_movimiento=TipoMovimientoFidelidad.CANJE,
            puntos=-puntos_requeridos,
            sellos=-sellos_requeridos,
            descripcion=payload.descripcion or "Canje de premio de fidelidad",
        )
        return self._build_canje_response(usuario_id, movimiento)

    def canjear_cafe(self, usuario_id: UUID) -> CanjeResponse:
        regla = self.repo.get_regla_activa_principal()
        puntos_requeridos = regla.puntos_canje_cafe if regla else 0
        sellos_requeridos = regla.sellos_canje_cafe if regla else 10
        self._validar_saldo(usuario_id, puntos_requeridos, sellos_requeridos)
        movimiento = self.repo.create_movimiento(
            usuario_id=usuario_id,
            pedido_id=None,
            tipo_movimiento=TipoMovimientoFidelidad.CANJE,
            puntos=-puntos_requeridos,
            sellos=-sellos_requeridos,
            descripcion="Canje de cafe gratis",
        )
        return self._build_canje_response(usuario_id, movimiento)

    def _validar_saldo(self, usuario_id: UUID, puntos: int, sellos: int) -> None:
        resumen = self.get_resumen(usuario_id)
        if resumen.puntos < puntos or resumen.sellos < sellos:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Saldo de fidelidad insuficiente para realizar el canje.",
            )

    def _build_canje_response(self, usuario_id: UUID, movimiento: FidelidadMovimiento) -> CanjeResponse:
        resumen = self.get_resumen(usuario_id)
        return CanjeResponse(
            usuario_id=usuario_id,
            puntos=resumen.puntos,
            sellos=resumen.sellos,
            cafesGratis=resumen.cafesGratis,
            movimiento=movimiento,
        )
