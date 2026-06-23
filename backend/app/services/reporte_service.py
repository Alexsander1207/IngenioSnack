from __future__ import annotations

from datetime import datetime, timezone

from app.models.pedido import PedidoEstado
from app.repositories.reporte_repository import ReporteRepository
from app.schemas.reporte_schema import (
    FidelidadData,
    FidelidadResponse,
    FiltrosVentasRead,
    ProductosData,
    ProductosResponse,
    ResumenData,
    ResumenResponse,
    VentasData,
    VentasResponse,
)


class ReporteService:
    def __init__(self, repository: ReporteRepository) -> None:
        self.repository = repository

    def get_resumen(self) -> ResumenResponse:
        data: ResumenData = self.repository.get_resumen()
        return ResumenResponse(data=data, generated_at=datetime.now(timezone.utc))

    def get_ventas(
        self,
        fecha_inicio: datetime | None,
        fecha_fin: datetime | None,
        estado: PedidoEstado | None,
    ) -> VentasResponse:
        data: VentasData = self.repository.get_ventas(fecha_inicio, fecha_fin, estado)
        return VentasResponse(
            data=data,
            filters=FiltrosVentasRead(
                fecha_inicio=fecha_inicio,
                fecha_fin=fecha_fin,
                estado=estado.value if estado else None,
            ),
            generated_at=datetime.now(timezone.utc),
        )

    def get_productos(self) -> ProductosResponse:
        data: ProductosData = self.repository.get_productos()
        return ProductosResponse(data=data, generated_at=datetime.now(timezone.utc))

    def get_fidelidad(self) -> FidelidadResponse:
        data: FidelidadData = self.repository.get_fidelidad()
        return FidelidadResponse(data=data, generated_at=datetime.now(timezone.utc))
