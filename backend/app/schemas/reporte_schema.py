from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class FiltrosVentasRead(BaseModel):
    fecha_inicio: datetime | None = None
    fecha_fin: datetime | None = None
    estado: str | None = None


class VentaPorEstado(BaseModel):
    estado: str
    total: Decimal
    cantidad: int


class VentaPorDia(BaseModel):
    fecha: date
    total: Decimal
    cantidad: int


class ResumenData(BaseModel):
    total_pedidos: int = 0
    ventas_totales: Decimal = Decimal("0")
    pedidos_pendientes: int = 0
    pedidos_recogidos: int = 0
    productos_activos: int = 0
    stock_bajo: int = 0
    puntos_emitidos: int = 0
    sellos_emitidos: int = 0
    estudiantes_registrados: int = 0


class VentasData(BaseModel):
    total_ventas: Decimal = Decimal("0")
    cantidad_pedidos: int = 0
    ticket_promedio: Decimal = Decimal("0")
    ventas_por_estado: list[VentaPorEstado] = Field(default_factory=list)
    ventas_por_dia: list[VentaPorDia] = Field(default_factory=list)


class ProductoVendidoItem(BaseModel):
    producto_id: UUID
    nombre: str
    cantidad_vendida: int
    total: Decimal
    categoria: str | None = None


class ProductoStockBajoItem(BaseModel):
    producto_id: UUID
    nombre: str
    stock: int


class ProductosData(BaseModel):
    productos_mas_vendidos: list[ProductoVendidoItem] = Field(default_factory=list)
    productos_con_stock_bajo: list[ProductoStockBajoItem] = Field(default_factory=list)
    productos_activos: int = 0
    productos_inactivos: int = 0


class MovimientoFidelidadResumen(BaseModel):
    id: UUID
    usuario_id: UUID
    tipo_movimiento: str
    puntos: int
    sellos: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class FidelidadData(BaseModel):
    puntos_emitidos: int = 0
    sellos_emitidos: int = 0
    usuarios_con_fidelidad: int = 0
    movimientos_recientes: list[MovimientoFidelidadResumen] = Field(default_factory=list)


class ResumenResponse(BaseModel):
    data: ResumenData
    generated_at: datetime


class VentasResponse(BaseModel):
    data: VentasData
    filters: FiltrosVentasRead
    generated_at: datetime


class ProductosResponse(BaseModel):
    data: ProductosData
    generated_at: datetime


class FidelidadResponse(BaseModel):
    data: FidelidadData
    generated_at: datetime
