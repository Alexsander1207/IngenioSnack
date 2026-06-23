# IngenioSnack FastAPI Backend

Backend FastAPI paralelo para la migracion tecnica desde Express/Node sin modificar el backend actual.

## Alcance actual

- Mantiene una aplicacion FastAPI independiente en `backend/`.
- Expone `GET /api/v1/health`.
- Expone `GET /api/v1/health/config` sin secretos para validar configuracion tecnica.
- Configura CORS para desarrollo local.
- Prepara configuracion por entorno con `pydantic-settings`.
- Prepara conexion a PostgreSQL/Supabase mediante `DATABASE_URL`.
- Agrega modulos base de productos.
- Agrega autenticacion tecnica con bcrypt, JWT y roles.
- Agrega modulo base de pedidos con reglas transaccionales defensivas.
- Agrega una propuesta inicial de esquema SQL en `../database/schema.sql`.
- No migra reportes.
- La acreditacion real de fidelidad y la devolucion completa de stock por cancelacion quedan para fases posteriores.
- No reemplaza ni elimina `server.js` ni `src/`.

## Crear entorno virtual

```bash
cd backend
python -m venv .venv
```

Activar en Windows PowerShell:

```bash
.venv\Scripts\Activate.ps1
```

Activar en macOS/Linux:

```bash
source .venv/bin/activate
```

## Instalar dependencias

```bash
pip install -r requirements.txt
```

## Levantar el backend

```bash
uvicorn app.main:app --reload
```

El backend queda disponible por defecto en:

```text
http://127.0.0.1:8000
```

## Healthcheck

```http
GET /api/v1/health
```

Respuesta esperada:

```json
{
  "status": "ok",
  "service": "IngenioSnack API",
  "version": "1.0.0"
}
```

Configuracion tecnica segura:

```http
GET /api/v1/health/config
```

Este endpoint no expone `DATABASE_URL` ni credenciales.

## Swagger

La documentacion interactiva esta disponible en:

```text
/docs
```

## Ejecutar tests

```bash
pytest
```

## Variables de entorno

Copiar `.env.example` a `.env` si se necesita personalizar configuracion local:

```bash
cp .env.example .env
```

Variables minimas:

```env
APP_NAME=IngenioSnack API
APP_VERSION=1.0.0
ENVIRONMENT=development
API_V1_PREFIX=/api/v1
DATABASE_URL=postgresql+psycopg://USER:PASSWORD@HOST:PORT/DATABASE
SECRET_KEY=change_me_in_production
ACCESS_TOKEN_EXPIRE_MINUTES=60
ALGORITHM=HS256
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

`DATABASE_URL` debe apuntar al PostgreSQL de Supabase o a una base PostgreSQL local. No se debe commitear un `.env` real ni credenciales.

Formato esperado para Supabase/PostgreSQL:

```text
postgresql+psycopg://USER:PASSWORD@HOST:PORT/DATABASE
```

Si `DATABASE_URL` no existe, la aplicacion puede levantar y responder healthchecks, pero cualquier uso futuro de base de datos debe fallar con un error de configuracion claro.

## Endpoints

Health:

```http
GET /api/v1/health
GET /api/v1/health/config
```

Productos:

```http
GET /api/v1/productos
GET /api/v1/productos/{producto_id}
POST /api/v1/productos
PUT /api/v1/productos/{producto_id}
DELETE /api/v1/productos/{producto_id}
```

Auth:

```http
POST /api/v1/auth/register
POST /api/v1/auth/login
GET /api/v1/auth/me
```

Pedidos:

```http
POST /api/v1/pedidos
GET /api/v1/pedidos/mis-pedidos
GET /api/v1/pedidos/admin
GET /api/v1/pedidos/{pedido_id}
PATCH /api/v1/pedidos/{pedido_id}/estado
```

## Autenticacion y roles

Los passwords se guardan con bcrypt mediante `passlib`. No se usa SHA-256.

Roles disponibles:

- `ADMIN`
- `ESTUDIANTE`

Registro de estudiante:

```bash
curl -X POST http://127.0.0.1:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"nombre\":\"Ana Quispe\",\"correo\":\"ana@uncp.edu.pe\",\"password\":\"password123\",\"codigo_estudiante\":\"ANA\"}"
```

Login:

```bash
curl -X POST http://127.0.0.1:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"correo\":\"ana@uncp.edu.pe\",\"password\":\"password123\"}"
```

Uso del token:

```http
Authorization: Bearer <token>
```

Rutas publicas:

- `GET /api/v1/health`
- `GET /api/v1/health/config`
- `GET /api/v1/productos`
- `GET /api/v1/productos/{producto_id}`
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`

Rutas protegidas:

- `GET /api/v1/auth/me`: requiere Bearer token.
- `POST /api/v1/productos`: requiere rol `ADMIN`.
- `PUT /api/v1/productos/{producto_id}`: requiere rol `ADMIN`.
- `DELETE /api/v1/productos/{producto_id}`: requiere rol `ADMIN`.
- `POST /api/v1/pedidos`: requiere usuario autenticado.
- `GET /api/v1/pedidos/mis-pedidos`: requiere usuario autenticado.
- `GET /api/v1/pedidos/admin`: requiere rol `ADMIN`.
- `PATCH /api/v1/pedidos/{pedido_id}/estado`: requiere rol `ADMIN`.

No hay credenciales admin quemadas. Si se requiere un usuario `ADMIN` inicial, debe crearse en una fase posterior mediante seed controlado o proceso operativo seguro.

## Pedidos

Estados permitidos:

- `PENDIENTE`
- `PREPARANDO`
- `LISTO`
- `RECOGIDO`
- `CANCELADO`

Reglas implementadas:

- El estudiante autenticado puede crear pedidos.
- El estudiante solo lista sus propios pedidos en `mis-pedidos`.
- `ADMIN` puede listar todos los pedidos.
- `ADMIN` puede cambiar estado.
- Crear pedido valida lista no vacia, cantidades mayores a cero, existencia de producto y stock cuando el repositorio de productos esta disponible.
- El total se calcula desde `precio_unitario * cantidad`.
- El pedido usa UUID como `id` y un `codigo` visible basado en timestamp UTC y sufijo UUID corto.
- No se generan codigos secuenciales tipo `PED-0001`.
- Al pasar por primera vez a `RECOGIDO`, el servicio marca `fidelidad_acreditada = true`.
- `fidelidad_acreditada` evita doble acreditacion.

Integraciones pendientes/controladas:

- Promociones: `promocion_id` esta preparado en items, pero el calculo de descuento queda para la fase/integracion de promociones.
- Stock: el descuento de stock se realiza de forma transaccional sobre producto cuando esta disponible. El registro formal de movimiento queda preparado como hook tecnico para consolidarse con el modulo Stock.
- Cancelacion: la devolucion completa de stock por `CANCELADO` queda documentada para fase posterior.
- Fidelidad: si existe un servicio con `acreditar_por_pedido`, el servicio de pedidos puede invocarlo; si no, se usa el flag `fidelidad_acreditada` como proteccion contra duplicidad.

## Base de datos

El archivo `../database/schema.sql` contiene una propuesta inicial de esquema para Supabase/PostgreSQL. En esta fase no se ejecuta automaticamente contra Supabase.

Tablas preparadas:

- `usuarios`
- `productos`
- `promociones`
- `pedidos`
- `items_pedido`
- `movimientos_stock`
- `fidelidad_movimientos`

Incluye UUID con `gen_random_uuid()`, timestamps `TIMESTAMPTZ`, roles `ADMIN` y `ESTUDIANTE`, estados de pedido y campos necesarios para fases posteriores.

## Fidelidad

Modulo de fidelizacion por puntos y sellos. Cada pedido recogido acredita puntos (floor del total) y un sello al estudiante.

### Endpoints

```http
GET  /api/v1/fidelidad/me
GET  /api/v1/fidelidad/movimientos
GET  /api/v1/fidelidad/usuario/{usuario_id}
POST /api/v1/fidelidad/acreditar
```

### Reglas de acceso

| Endpoint | Rol requerido |
|---|---|
| GET /fidelidad/me | Cualquier usuario autenticado |
| GET /fidelidad/movimientos | Cualquier usuario autenticado (devuelve los propios) |
| GET /fidelidad/usuario/{id} | ADMIN |
| POST /fidelidad/acreditar | ADMIN |

### Calculo de puntos y sellos

- `puntos = floor(total_pedido)`
- `sellos = 1 por pedido recogido`

### Idempotencia por pedido_id

Un pedido no puede generar fidelidad mas de una vez. Si se llama a `acreditar_por_pedido` con el mismo `pedido_id` dos veces, el segundo llamado devuelve el movimiento existente sin crear duplicado.

### Metodo interno reutilizable

```python
fidelidad_service.acreditar_por_pedido(
    usuario_id=pedido.usuario_id,
    pedido_id=pedido.id,
    total_pedido=pedido.total,
)
```

### Integracion con FASE 7 (pedidos)

La acreditacion se activa cuando un pedido cambia a estado `RECOGIDO`. Cuando FASE 7 (pedido_service) este integrado, debe llamar al metodo de arriba en el handler de cambio de estado. El modulo de fidelidad no modifica pedidos; solo registra movimientos.

### Estructura de respuesta GET /fidelidad/me

```json
{
  "usuario_id": "uuid",
  "puntos": 75,
  "sellos": 3,
  "movimientos": [...]
}
```

### Tipos de movimiento

| Tipo | Descripcion |
|---|---|
| ACREDITACION_PEDIDO | Puntos y sello por pedido recogido |
| AJUSTE_ADMIN | Correccion manual por administrador |
| CANJE | Descuento de puntos/sellos por canje |
| REVERSA | Anulacion de una acreditacion previa |
