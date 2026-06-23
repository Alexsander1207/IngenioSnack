# Evidencias Técnicas — IngenioSnack

## 1. Supabase activo

El proyecto usa Supabase como proveedor de PostgreSQL en la nube.

**Indicadores de conexión activa:**

- La variable `DATABASE_URL` en `backend/.env` apunta al proyecto Supabase real.
- El endpoint `GET /api/v1/health` retorna `{ "status": "ok", "database": "connected" }` cuando la conexión está activa.
- Los tests de integración con DB real (en desarrollo) usan la misma `DATABASE_URL`.

**Verificación manual:**

```bash
# Con el backend corriendo:
curl http://localhost:8000/api/v1/health
# Esperado: { "status": "ok", "database": "connected", "version": "1.0.0" }
```

---

## 2. Tests — 73/73 passed

Suite de tests del backend con pytest. Usan SQLite en memoria — no requieren conexión a Supabase.

**Ejecutar:**

```bash
cd backend
python -m pytest -v
```

**Resultado esperado:**

```
tests/test_auth.py          ✅  (registro, login, token, perfil, errores)
tests/test_categorias.py    ✅  (CRUD completo, slug único)
tests/test_fidelidad.py     ✅  (saldo, acreditación, canje, ajuste admin)
tests/test_health.py        ✅  (health check sin y con DB)
tests/test_pedidos.py       ✅  (crear pedido, mis pedidos, admin, estado)
tests/test_productos.py     ✅  (CRUD, disponibilidad, filtros)
tests/test_promociones.py   ✅  (CRUD, fechas de vigencia)
tests/test_reportes.py      ✅  (dashboard, ventas, productos)
tests/test_stock.py         ✅  (ajuste, historial, movimientos)

73 passed in X.XXs
```

**Estrategia de tests:**

- `conftest.py` crea un engine SQLite en memoria con scope de sesión.
- Cada test recibe una sesión con rollback automático — aislamiento total.
- Se usa `TestClient` de FastAPI (basado en `httpx`) — no hay mocks de repositorios.
- Los tests verifican comportamiento HTTP (status codes, response body, errores).

---

## 3. Build del frontend

```bash
cd client
npm run build
```

**Resultado esperado:**

```
vite v8.x.x building for production...
✓ X modules transformed.
dist/index.html               X.XX kB
dist/assets/index-XXXXXXXX.js X.XX kB │ gzip: X.XX kB
✓ built in X.XXs
```

El build de producción se genera en `client/dist/`. El archivo `public/index.html` apunta al bundle generado.

---

## 4. Endpoints principales

Todos los endpoints están documentados automáticamente en Swagger UI con el backend corriendo:

```
http://localhost:8000/docs
```

### Auth

| Método | Endpoint                    | Auth       | Descripción                   |
|--------|-----------------------------|------------|-------------------------------|
| POST   | `/api/v1/auth/register`     | —          | Registrar nuevo usuario       |
| POST   | `/api/v1/auth/login`        | —          | Login — retorna JWT           |
| GET    | `/api/v1/auth/me`           | Bearer     | Perfil del usuario actual     |

### Productos

| Método | Endpoint                    | Auth       | Descripción                   |
|--------|-----------------------------|------------|-------------------------------|
| GET    | `/api/v1/productos`         | Opcional   | Listar productos              |
| POST   | `/api/v1/productos`         | ADMIN      | Crear producto                |
| GET    | `/api/v1/productos/{id}`    | Bearer     | Obtener producto              |
| PATCH  | `/api/v1/productos/{id}`    | ADMIN      | Actualizar producto           |
| DELETE | `/api/v1/productos/{id}`    | ADMIN      | Desactivar producto           |

### Pedidos

| Método | Endpoint                        | Auth        | Descripción                     |
|--------|---------------------------------|-------------|---------------------------------|
| POST   | `/api/v1/pedidos`               | Bearer      | Crear pedido                    |
| GET    | `/api/v1/pedidos/mis-pedidos`   | Bearer      | Mis pedidos (estudiante)        |
| GET    | `/api/v1/pedidos/admin`         | ADMIN       | Todos los pedidos (admin)       |
| GET    | `/api/v1/pedidos/{id}`          | Bearer      | Obtener pedido por ID           |
| PATCH  | `/api/v1/pedidos/{id}/estado`   | ADMIN       | Cambiar estado del pedido       |

### Fidelidad

| Método | Endpoint                        | Auth        | Descripción                     |
|--------|---------------------------------|-------------|---------------------------------|
| GET    | `/api/v1/fidelidad/mi-saldo`    | Bearer      | Saldo de puntos y sellos        |
| POST   | `/api/v1/fidelidad/canjear-cafe`| Bearer      | Canjear café gratis             |
| GET    | `/api/v1/fidelidad/reglas`      | ADMIN       | Ver reglas activas              |
| POST   | `/api/v1/fidelidad/ajuste`      | ADMIN       | Ajuste manual de puntos         |

### Reportes

| Método | Endpoint                         | Auth  | Descripción                        |
|--------|----------------------------------|-------|------------------------------------|
| GET    | `/api/v1/reportes/dashboard`     | ADMIN | Métricas generales del día/semana  |
| GET    | `/api/v1/reportes/ventas`        | ADMIN | Ventas por período                 |
| GET    | `/api/v1/reportes/productos`     | ADMIN | Productos más vendidos             |

### Otros

| Método | Endpoint                    | Auth  | Descripción                |
|--------|-----------------------------|-------|----------------------------|
| GET    | `/api/v1/health`            | —     | Estado del servicio        |
| GET    | `/api/v1/categorias`        | —     | Listar categorías          |
| POST   | `/api/v1/categorias`        | ADMIN | Crear categoría            |
| GET    | `/api/v1/stock/movimientos` | ADMIN | Historial de stock         |
| POST   | `/api/v1/stock/ajuste`      | ADMIN | Ajuste manual de stock     |
| GET    | `/api/v1/promociones`       | —     | Listar promociones         |
| POST   | `/api/v1/promociones`       | ADMIN | Crear promoción            |

---

## 5. Flujo manual recomendado para sustentación

Secuencia sugerida para demostrar el sistema en vivo:

### Paso 1 — Verificar servicios

```bash
# Terminal 1 — backend
cd backend && uvicorn app.main:app --reload

# Terminal 2 — frontend
cd client && npm run dev

# Terminal 3 — tests
cd backend && python -m pytest -v
```

### Paso 2 — Login como admin

1. Ir a `http://localhost:5173`
2. Ingresar con `admin.dev@ingeniosnack.local`
3. Verificar redirección al Panel de administración

### Paso 3 — Gestión del menú

1. Ir a **Productos** → crear un nuevo producto con stock > 0
2. Ir a **Categorías** → verificar categorías existentes
3. Ir a **Promociones** → ver combos activos

### Paso 4 — Pedido como estudiante

1. Abrir otra ventana / incógnito
2. Login con `estudiante.dev@ingeniosnack.local`
3. Ir al **Menú** → agregar productos al carrito
4. Ir al **Carrito** → confirmar pedido
5. Ver pedido en **Mis pedidos** con estado PENDIENTE

### Paso 5 — Gestión del pedido (admin)

1. Volver a la ventana admin → **Pedidos**
2. Cambiar estado del pedido: PENDIENTE → PREPARANDO → LISTO → RECOGIDO
3. Verificar que al pasar a RECOGIDO se acreditan puntos de fidelidad

### Paso 6 — Fidelidad del estudiante

1. Volver a la ventana estudiante → **Perfil**
2. Verificar que se acreditaron puntos y sellos
3. Si tiene ≥ 10 sellos → mostrar opción de canjear café gratis

### Paso 7 — Reportes

1. En el panel admin → **Reporte**
2. Mostrar dashboard con métricas del pedido recién completado
3. Mostrar gráficos de ventas y productos más vendidos

### Paso 8 — Swagger UI

1. Abrir `http://localhost:8000/docs`
2. Mostrar la documentación automática de todos los endpoints
3. Ejecutar un GET `/api/v1/health` directamente desde Swagger

---

## 6. Notas de seguridad

- El archivo `backend/.env` **no** está en el repositorio (`.gitignore`).
- No se expone `DATABASE_URL` en ningún archivo commitado.
- Los hashes de contraseña en `database/seed.sql` son placeholders — no válidos para login.
- Los JWTs expiran en 60 minutos (configurable via `ACCESS_TOKEN_EXPIRE_MINUTES`).
- El endpoint `/api/v1/auth/me` permite verificar el token sin exponer el hash de contraseña.
