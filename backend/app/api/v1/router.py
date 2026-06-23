from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.categorias import router as categorias_router
from app.api.v1.clientes import router as clientes_router
from app.api.v1.favoritos import router as favoritos_router
from app.api.v1.fidelidad import legacy_estudiante_router, router as fidelidad_router
from app.api.v1.health import router as health_router
from app.api.v1.pedidos import router as pedidos_router
from app.api.v1.productos import router as productos_router
from app.api.v1.promociones import router as promociones_router
from app.api.v1.reportes import router as reportes_router
from app.api.v1.stock import router as stock_router


api_router = APIRouter()
api_router.include_router(health_router, tags=["health"])
api_router.include_router(auth_router)
api_router.include_router(categorias_router)
api_router.include_router(clientes_router)
api_router.include_router(productos_router)
api_router.include_router(favoritos_router)
api_router.include_router(stock_router)
api_router.include_router(promociones_router)
api_router.include_router(pedidos_router)
api_router.include_router(fidelidad_router)
api_router.include_router(legacy_estudiante_router)
api_router.include_router(reportes_router)
