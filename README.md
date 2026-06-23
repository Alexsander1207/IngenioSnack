# IngenioSnack

Sistema de pedidos anticipados para la cafetería **IngenioSnack**, ubicada al costado de los laboratorios de la Facultad de Ingeniería de Sistemas de la UNCP.

**Asignatura:** Metodología de Desarrollo de Software (IS055B) — Unidad II: XP  
**Sprint:** MVP 5 días — Semana 10 — **ENTREGADO**

---

## Descripción del sistema

**IngenioSnack** resuelve el problema de acumulación de estudiantes durante el recreo. Los estudiantes realizan pedidos anticipados desde su celular antes de salir de clase, los recogen rápidamente y pagan contra entrega, eliminando las filas y la pérdida de tiempo.

El sistema tiene dos roles:

- **Estudiante** — consulta el menú, arma su carrito, crea pedidos, acumula puntos y sellos de fidelidad.
- **Administrador** — gestiona productos, categorías, promociones, stock, cambia estados de pedidos y consulta reportes.

---

## Arquitectura general

```
IngenioSnack/
├── backend/          # FastAPI — API REST con auth JWT y roles
│   ├── app/
│   │   ├── api/v1/       # endpoints por módulo
│   │   ├── core/         # config, database, security
│   │   ├── models/       # ORM SQLAlchemy
│   │   ├── repositories/ # acceso a datos
│   │   ├── schemas/      # Pydantic schemas (validación)
│   │   └── services/     # lógica de negocio
│   └── tests/            # pytest — 73 tests, SQLite en memoria
├── client/           # React 19 + Vite 8 — SPA
│   └── src/
│       ├── pages/admin/    # panel administrador
│       ├── pages/student/  # portal estudiante
│       ├── components/     # Charts, Toast
│       ├── context/        # AppContext (estado global)
│       └── services/       # apiClient.js
├── database/         # schema.sql + seed.sql para Supabase/PostgreSQL
├── docs/             # documentación técnica y académica
└── uploads/          # imágenes de productos
```

Ver `docs/ARQUITECTURA.md` para el detalle completo.

---

## Tecnologías

| Capa       | Tecnología            | Versión  | Uso                                        |
|------------|-----------------------|----------|--------------------------------------------|
| Backend    | FastAPI               | latest   | API REST, routing, validación              |
| Backend    | SQLAlchemy 2.x        | latest   | ORM para PostgreSQL                        |
| Backend    | python-jose           | latest   | JWT — generación y validación de tokens    |
| Backend    | passlib + bcrypt      | latest   | Hash de contraseñas                        |
| Backend    | psycopg[binary]       | latest   | Driver PostgreSQL                          |
| Backend    | uvicorn               | latest   | Servidor ASGI                              |
| Frontend   | React                 | 19.x     | UI SPA                                     |
| Frontend   | Vite                  | 8.x      | Bundler y dev server                       |
| Frontend   | react-router-dom      | 7.x      | Navegación client-side                     |
| Frontend   | lucide-react          | latest   | Iconografía                                |
| Base datos | Supabase (PostgreSQL) | —        | Base de datos en la nube                   |
| Tests      | pytest + httpx        | latest   | Suite de tests del backend (73 tests)      |

---

## Requisitos previos

- Python 3.12+
- Node.js 20+ y npm
- Cuenta Supabase (proyecto activo) o PostgreSQL local
- Git

---

## Instalación

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd IngenioSnack
```

### 2. Backend

```bash
cd backend
python -m venv .venv

# Windows PowerShell
.venv\Scripts\Activate.ps1

# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt
```

### 3. Frontend

```bash
cd client
npm install
```

---

## Variables de entorno

### Backend (`backend/.env`)

Copiar `backend/.env.example` y completar con los valores reales:

```env
# Cadena de conexión PostgreSQL/Supabase
# Formato: postgresql+psycopg://USUARIO:PASSWORD@HOST:PORT/DATABASE
DATABASE_URL=postgresql+psycopg://usuario:password@host:5432/postgres

# Clave secreta para firmar JWT — cambiar en producción
SECRET_KEY=clave_secreta_larga_y_aleatoria

# Entorno: development | test | staging | production
ENVIRONMENT=development

# Tiempo de expiración del token en minutos
ACCESS_TOKEN_EXPIRE_MINUTES=60

# Orígenes permitidos para CORS (separados por coma)
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

> El archivo `.env` está en `.gitignore` y **nunca** se sube al repositorio.

### Frontend (`client/.env`)

```env
# URL base del backend — en desarrollo usa proxy de Vite, en producción la URL real
VITE_API_URL=http://localhost:8000
```

---

## Ejecución

### Backend

```bash
cd backend
uvicorn app.main:app --reload
# API disponible en: http://localhost:8000
# Swagger UI en:     http://localhost:8000/docs
# ReDoc en:          http://localhost:8000/redoc
```

### Frontend

```bash
cd client
npm run dev
# App disponible en: http://localhost:5173
# El proxy de Vite redirige /api → http://localhost:8000
```

---

## Usuarios de desarrollo

Después de ejecutar `database/seed.sql` en Supabase, existen dos usuarios base. Los hashes de contraseña son **placeholders** — para activar el login se deben generar hashes reales con:

```bash
cd backend
python scripts/generate_dev_password_hash.py
```

| Rol          | Correo                            | Código estudiante |
|--------------|-----------------------------------|-------------------|
| ADMIN        | admin.dev@ingeniosnack.local      | —                 |
| ESTUDIANTE   | estudiante.dev@ingeniosnack.local | DEV-EST-001       |

> Las contraseñas de desarrollo se configuran localmente y no se commitean.

---

## Pruebas

```bash
cd backend
python -m pytest
# Resultado esperado: 73 passed
```

Los tests usan SQLite en memoria — no requieren conexión a Supabase.

```bash
cd client
npm run build
# Resultado esperado: build exitoso en dist/
```

---

## Base de datos

El esquema completo está en `database/schema.sql`. El seed inicial (idempotente) está en `database/seed.sql`.

Ver `docs/BASE_DATOS.md` para el detalle de tablas, relaciones y constraints.

> **Importante:** si existe el archivo `supabase_setup.sql` en la raíz, es un archivo legacy. No ejecutarlo — usar `database/schema.sql` en su lugar.

---

## Documentación técnica

| Documento                    | Contenido                                         |
|------------------------------|---------------------------------------------------|
| `docs/ARQUITECTURA.md`       | Arquitectura por capas, flujo de comunicación     |
| `docs/BASE_DATOS.md`         | Tablas, relaciones, constraints, seed             |
| `docs/FLUJOS.md`             | Flujos principales del sistema                    |
| `docs/EVIDENCIAS.md`         | Evidencias de tests, build y endpoints            |

---

## Metodología XP aplicada

| Práctica XP             | Evidencia en este proyecto                              |
|-------------------------|---------------------------------------------------------|
| **TDD**                 | 73 tests backend — ciclo Red-Green-Refactor             |
| **Releases pequeños**   | MVP funcional en 5 días, iteraciones semanales          |
| **Diseño simple**       | Arquitectura por capas sin over-engineering             |
| **Propiedad colectiva** | Cualquier integrante modifica cualquier módulo          |
| **Integración continua**| Tests ejecutados en cada commit                         |
| **Refactorización**     | Migración Express → FastAPI documentada                 |

---

## Historias de usuario implementadas

| ID    | Historia                                        | Estado     |
|-------|-------------------------------------------------|------------|
| HU-01 | Identificación del estudiante                   | ✅ Cerrada |
| HU-02 | Consulta del menú disponible                    | ✅ Cerrada |
| HU-03 | Pedido anticipado desde celular                 | ✅ Cerrada |
| HU-04 | Validación de disponibilidad antes de confirmar | ✅ Cerrada |
| HU-05 | Gestión rápida de disponibilidad (Sr. Julio)    | ✅ Cerrada |
| HU-06 | Pago contra entrega y cambio de estado          | ✅ Cerrada |
| HU-07 | Registro de sandwiches para fidelidad           | ✅ Cerrada |

---

## Integrantes

| # | Nombre                            | Rol principal                |
|---|-----------------------------------|------------------------------|
| 1 | Artica Arias Gustavo Alonso       | Frontend y diseño visual     |
| 2 | Chavez Paquiyauri Jack Luis       | Backend y lógica del sistema |
| 3 | Flores Ccente Franklin David      | Tests, TDD y refactorización |
| 4 | Jayo Mallqui Alexsander Antoni    | Documentación y evidencias   |
| 5 | Raymundo Condor Frank Angel       | Integración y soporte        |

---

*Práctica desarrollada para entrega académica — IS055B UNCP FIS*
