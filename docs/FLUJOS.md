# Flujos del Sistema — IngenioSnack

## 1. Flujo de login

```
[Usuario] → Login.jsx
     │
     │  POST /api/v1/auth/login
     │  { "correo": "...", "password": "..." }
     ▼
[Backend — auth.py]
     │
     ├── UsuarioRepository.get_by_correo(correo)
     │   └── si no existe → 401 Unauthorized
     │
     ├── passlib.verify(password, hashed_password)
     │   └── si falla → 401 Unauthorized
     │
     └── create_access_token(sub=user_id, rol=rol)
         └── firma HS256 con SECRET_KEY
         └── retorna { "access_token": "...", "token_type": "bearer" }
     │
[Cliente]
     │
     ├── guarda token en AppContext (memoria)
     └── redirige a:
         ├── /admin  (rol ADMIN)
         └── /menu   (rol ESTUDIANTE)
```

**Validaciones:**
- Correo debe existir en la tabla `usuarios`.
- Usuario debe tener `activo = true`.
- Password verificado con bcrypt.

---

## 2. Flujo de gestión de productos (admin)

### Crear producto

```
[Admin] → Productos.jsx → formulario
     │
     │  POST /api/v1/productos
     │  Authorization: Bearer <token>
     │  { nombre, descripcion, precio, categoria_id, stock, disponible }
     ▼
[Backend — productos.py]
     │
     ├── require_role(ADMIN) → valida JWT y rol
     ├── Pydantic valida schema
     ├── ProductoService.crear(payload)
     │   └── ProductoRepository.create(producto)
     └── retorna ProductoRead (201 Created)
```

### Listar productos (estudiante/admin)

```
GET /api/v1/productos
     │
     ├── sin auth → retorna solo disponibles y activos
     └── con auth ADMIN → retorna todos (incluyendo inactivos)
```

### Cambiar disponibilidad

```
PATCH /api/v1/productos/{id}
     │
     └── actualiza campo `disponible` o `activo`
         └── el cambio es inmediato — el menú del estudiante lo refleja en la siguiente consulta
```

---

## 3. Flujo de pedido del estudiante

### Paso a paso completo

```
[Estudiante] → Menu.jsx
     │
     │  GET /api/v1/productos  (filtra disponibles)
     │  GET /api/v1/promociones (filtra vigentes)
     ▼
[Estudiante] → Cart.jsx
     │  agrega ítems al carrito (estado local React)
     │
     │  POST /api/v1/pedidos
     │  Authorization: Bearer <token>
     │  {
     │    "items": [
     │      { "producto_id": "...", "cantidad": 2 },
     │      { "promocion_id": "...", "cantidad": 1 }
     │    ],
     │    "notas": "sin azúcar"
     │  }
     ▼
[Backend — pedidos.py + PedidoService]
     │
     ├── get_current_user → obtiene usuario autenticado
     ├── Para cada ítem:
     │   ├── valida que producto/promoción existe y está disponible
     │   └── verifica stock suficiente
     ├── Calcula subtotal, descuento, total
     ├── Genera código único de pedido (ej: "PED-20240623-0001")
     ├── Crea registro en `pedidos` (estado: PENDIENTE)
     ├── Crea registros en `items_pedido`
     ├── Descuenta stock de cada producto
     │   └── registra movimiento en `movimientos_stock` (tipo: SALIDA)
     └── retorna PedidoRead (201 Created)
     │
[Estudiante] → MyOrders.jsx
     │  GET /api/v1/pedidos/mis-pedidos
     └── ve su pedido con estado PENDIENTE y código para recoger
```

**Regla de negocio central (HU-04):**  
Si algún producto del carrito tiene `disponible = false`, el pedido es rechazado con 422 — *"El pedido contiene productos no disponibles"*.

---

## 4. Flujo de cambio de estado del pedido

```
[Admin] → Pedidos.jsx
     │  ve lista de pedidos con GET /api/v1/pedidos/admin
     │
     │  PATCH /api/v1/pedidos/{id}/estado
     │  Authorization: Bearer <token ADMIN>
     │  { "estado": "PREPARANDO" }
     ▼
[Backend]
     │
     ├── require_role(ADMIN)
     ├── PedidoService.cambiar_estado(pedido_id, nuevo_estado)
     └── valida transición de estado y persiste

Ciclo de estados:
PENDIENTE → PREPARANDO → LISTO → RECOGIDO
                                └── CANCELADO (desde cualquier estado activo)
```

**Acciones automáticas al cambiar a RECOGIDO:**
- Si `fidelidad_acreditada = false`, el servicio de fidelidad acredita puntos y sellos al estudiante.
- Registra movimiento en `fidelidad_movimientos` (tipo: `ACREDITACION_PEDIDO`).
- Marca `fidelidad_acreditada = true` en el pedido.

---

## 5. Flujo de fidelidad

### Acreditación automática

```
pedido → estado RECOGIDO
     │
     └── FidelidadService.acreditar(pedido)
         ├── carga regla PRINCIPAL activa de `fidelidad_reglas`
         ├── calcula puntos = total × puntos_por_sol
         ├── calcula sellos = 1 (por pedido completado)
         └── inserta en `fidelidad_movimientos`
             (tipo: ACREDITACION_PEDIDO)
             con índice único → previene doble acreditación
```

### Consulta de saldo (estudiante)

```
GET /api/v1/fidelidad/mi-saldo
     │
     └── suma `puntos` y `sellos` de todos los movimientos del usuario
         retorna { puntos_total, sellos_total, sellos_para_cafe }
```

### Canje de café gratis

```
POST /api/v1/fidelidad/canjear-cafe
     │
     ├── verifica sellos_total >= sellos_canje_cafe (default: 10)
     └── inserta movimiento negativo (tipo: CANJE)
         retorna confirmación del canje
```

### Ajuste manual (admin)

```
POST /api/v1/fidelidad/ajuste
     Authorization: Bearer <token ADMIN>
     { "usuario_id": "...", "puntos": 50, "sellos": 0, "descripcion": "..." }
     │
     └── inserta movimiento (tipo: AJUSTE_ADMIN)
```

---

## 6. Flujo de reportes

### Dashboard

```
GET /api/v1/reportes/dashboard
     Authorization: Bearer <token ADMIN>
     │
     └── ReporteRepository agrega:
         ├── total de pedidos del día / semana / mes
         ├── ingresos totales
         ├── pedidos por estado (conteo)
         └── stock crítico (productos con stock bajo umbral)
```

### Ventas por período

```
GET /api/v1/reportes/ventas?fecha_inicio=...&fecha_fin=...
     │
     └── agrupa pedidos RECOGIDOS por fecha
         retorna serie temporal de ingresos
```

### Productos más vendidos

```
GET /api/v1/reportes/productos
     │
     └── suma cantidades de items_pedido para pedidos RECOGIDOS
         ordena por cantidad descendente
         retorna ranking de productos
```

Los gráficos se renderizan en el frontend con el componente `Charts.jsx` usando los datos de estos endpoints.

---

## 7. Flujo de gestión de stock

### Ajuste manual

```
[Admin] → Inventario.jsx
     │
     │  POST /api/v1/stock/ajuste
     │  { "producto_id": "...", "cantidad": 10, "tipo": "INGRESO", "motivo": "..." }
     ▼
[Backend — StockService]
     │
     ├── actualiza `productos.stock`
     └── registra en `movimientos_stock` (tipo: INGRESO/AJUSTE)
```

### Historial de movimientos

```
GET /api/v1/stock/movimientos?producto_id=...
     │
     └── retorna todos los MovimientoStock del producto
         (creados por pedidos o por ajustes manuales)
```
