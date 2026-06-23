# Arquitectura del Sistema — IngenioSnack

## Visión general

IngenioSnack sigue una arquitectura **cliente-servidor de tres capas** con separación clara entre frontend SPA, API REST y base de datos relacional en la nube.

```
┌──────────────────────────────────────────────────────────┐
│  CLIENTE (Navegador)                                     │
│  React 19 + Vite 8 — SPA                                │
│  http://localhost:5173                                   │
└──────────────────┬───────────────────────────────────────┘
                   │  HTTP/REST (JSON)
                   │  /api/v1/*
                   │  Authorization: Bearer <JWT>
┌──────────────────▼───────────────────────────────────────┐
│  BACKEND (Servidor)                                      │
│  FastAPI + Uvicorn — Python 3.12                         │
│  http://localhost:8000                                   │
└──────────────────┬───────────────────────────────────────┘
                   │  SQLAlchemy 2.x (psycopg[binary])
                   │  postgresql+psycopg://...
┌──────────────────▼───────────────────────────────────────┐
│  BASE DE DATOS                                           │
│  Supabase — PostgreSQL                                   │
└──────────────────────────────────────────────────────────┘
```

---

## Frontend — React 19 + Vite 8

### Características

- **SPA** (Single Page Application) — enrutamiento client-side con `react-router-dom` v7.
- **Estado global** centralizado en `AppContext` (`context/AppContext.jsx`).
- **Proxy de desarrollo**: Vite redirige `/api/*` → `http://localhost:8000` para evitar problemas de CORS en desarrollo.
- **Iconografía**: `lucide-react`.
- **Sin CSS framework externo** — estilos propios en `index.css` y `App.css`.

### Estructura de páginas

```
src/pages/
├── Login.jsx               # Autenticación
├── AdminPortal.jsx         # Layout del panel administrador
├── StudentPortal.jsx       # Layout del portal estudiante
├── admin/
│   ├── Panel.jsx           # Dashboard con métricas
│   ├── Productos.jsx       # CRUD de productos
│   ├── Categorias.jsx      # CRUD de categorías
│   ├── Inventario.jsx      # Gestión de stock
│   ├── Movimientos.jsx     # Historial de movimientos de stock
│   ├── Pedidos.jsx         # Lista y cambio de estado de pedidos
│   ├── Promociones.jsx     # CRUD de promociones
│   ├── Fidelidad.jsx       # Reglas y panel de fidelidad
│   └── Reporte.jsx         # Reportes y gráficos
└── student/
    ├── Menu.jsx            # Menú disponible
    ├── Cart.jsx            # Carrito de compras
    ├── MyOrders.jsx        # Mis pedidos
    └── Profile.jsx         # Perfil y puntos de fidelidad
```

### Comunicación con el backend

Toda la comunicación pasa por `src/services/apiClient.js`, que:

1. Agrega el header `Authorization: Bearer <token>` automáticamente.
2. Maneja errores HTTP globalmente.
3. Usa `fetch` nativo — sin axios ni librerías adicionales.

---

## Backend — FastAPI + Python 3.12

### Arquitectura en capas

```
app/
├── main.py              # Factory de la app FastAPI (CORS, router, static files)
├── api/v1/
│   ├── router.py        # Agrupador de todos los routers
│   ├── auth.py          # POST /auth/register, /auth/login, GET /auth/me
│   ├── productos.py     # CRUD /productos
│   ├── categorias.py    # CRUD /categorias
│   ├── stock.py         # CRUD /stock + movimientos
│   ├── promociones.py   # CRUD /promociones
│   ├── pedidos.py       # CRUD /pedidos + cambio de estado
│   ├── fidelidad.py     # GET/POST /fidelidad + legacy /estudiante
│   ├── reportes.py      # GET /reportes/dashboard, /ventas, /productos
│   └── health.py        # GET /health
├── core/
│   ├── config.py        # Settings via pydantic-settings (.env)
│   ├── database.py      # Engine SQLAlchemy + get_db dependency
│   ├── security.py      # bcrypt, JWT, get_current_user, require_role
│   └── errors.py        # Excepciones de dominio
├── models/              # Modelos ORM SQLAlchemy (tablas)
├── schemas/             # Pydantic schemas (request/response)
├── repositories/        # Acceso a datos (queries SQLAlchemy)
└── services/            # Lógica de negocio
```

### Flujo de una request

```
HTTP Request
     │
     ▼
FastAPI Router (api/v1/*.py)
     │  valida schema Pydantic (request body)
     ▼
Dependency Injection
     │  get_db → Session SQLAlchemy
     │  get_current_user → verifica JWT → Usuario
     │  require_role → verifica rol
     ▼
Service Layer (services/*.py)
     │  lógica de negocio, reglas de dominio
     ▼
Repository Layer (repositories/*.py)
     │  queries SQLAlchemy
     ▼
SQLAlchemy ORM → PostgreSQL/Supabase
     │
     ▼
Response (schema Pydantic serializado a JSON)
```

---

## Autenticación y autorización — JWT propio

IngenioSnack usa JWT firmado localmente, **no** el sistema de auth de Supabase.

### Flujo de autenticación

```
1. POST /api/v1/auth/login
   { "correo": "...", "password": "..." }

2. Backend:
   - Busca usuario por correo
   - Verifica password con bcrypt (passlib)
   - Genera JWT: { sub: usuario_id, rol: "ADMIN"|"ESTUDIANTE", exp: ... }
   - Firma con SECRET_KEY usando HS256

3. Cliente almacena token en memoria (AppContext)

4. Requests autenticadas:
   Authorization: Bearer <token>

5. Backend valida:
   - Firma JWT (jose)
   - Extrae user_id → consulta usuario activo en DB
   - Inyecta Usuario en los endpoints via get_current_user
```

### Roles

| Rol          | Acceso                                                    |
|--------------|-----------------------------------------------------------|
| `ADMIN`      | Todos los endpoints, incluyendo gestión y reportes        |
| `ESTUDIANTE` | Menú, carrito, mis pedidos, perfil y fidelidad propia     |

La función `require_role(UsuarioRol.ADMIN)` como dependencia FastAPI protege automáticamente los endpoints administrativos.

---

## Base de datos — Supabase / PostgreSQL

- **ORM**: SQLAlchemy 2.x con driver `psycopg[binary]`.
- **Esquema**: definido en `database/schema.sql`.
- **Seed**: datos iniciales idempotentes en `database/seed.sql`.
- **Migraciones**: Alembic (incluido en `requirements.txt`).
- **Tests**: usan SQLite en memoria — no requieren Supabase.

Ver `docs/BASE_DATOS.md` para el detalle completo.

---

## Módulos principales

| Módulo        | Endpoints base           | Descripción                                          |
|---------------|--------------------------|------------------------------------------------------|
| Auth          | `/api/v1/auth`           | Registro, login, perfil propio                       |
| Productos     | `/api/v1/productos`      | CRUD completo, filtro por categoría y disponibilidad |
| Categorías    | `/api/v1/categorias`     | CRUD de categorías, slugs únicos                     |
| Stock         | `/api/v1/stock`          | Ajuste de stock, historial de movimientos            |
| Promociones   | `/api/v1/promociones`    | CRUD de promociones con fechas de vigencia           |
| Pedidos       | `/api/v1/pedidos`        | Crear, listar, cambiar estado                        |
| Fidelidad     | `/api/v1/fidelidad`      | Saldo de puntos/sellos, canje, reglas                |
| Reportes      | `/api/v1/reportes`       | Dashboard, ventas por período, productos más vendidos|
| Health        | `/api/v1/health`         | Estado del servicio y conexión a BD                  |

---

## Decisiones de arquitectura relevantes

| Decisión                              | Razón                                                               |
|---------------------------------------|---------------------------------------------------------------------|
| JWT propio en vez de Supabase Auth    | Control total sobre roles y payload; independencia del proveedor    |
| Repository pattern                    | Desacopla lógica de negocio del ORM; facilita tests con mocks       |
| SQLite en tests                       | Tests rápidos y sin dependencia de red; cobertura de lógica pura    |
| Proxy Vite en desarrollo              | Evita configuración CORS compleja durante el desarrollo local       |
| `categoria_id` nullable en productos  | Retrocompatibilidad con datos que usan el campo texto `categoria`   |
| Pago contra entrega                   | Fuera de alcance del MVP — sin integración bancaria                 |
