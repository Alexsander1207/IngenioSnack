# IngenioSnack — MVP Final

Sistema de pedidos anticipados para la cafeteria **IngenioSnack**, ubicada al costado
de los laboratorios de la Facultad de Ingenieria de Sistemas de la UNCP.

**Asignatura:** Metodologia de Desarrollo de Software (IS055B) — Unidad II: XP
**Sprint:** MVP 5 dias — Semana 10 — **ENTREGADO**

---

## Descripcion del proyecto

**IngenioSnack** resuelve el problema de acumulacion de estudiantes durante el recreo.
Los estudiantes realizan pedidos anticipados desde su celular antes de salir de clase,
los recogen rapidamente y pagan contra entrega, eliminando las filas y la perdida de tiempo.

---

## Tecnologias usadas

| Tecnologia            | Uso                                                       |
|-----------------------|-----------------------------------------------------------|
| FastAPI (Python)      | Backend principal — API REST con auth JWT y roles         |
| SQLAlchemy 2.x        | ORM para PostgreSQL/Supabase                              |
| React + Vite          | Frontend SPA                                             |
| Supabase (PostgreSQL) | Base de datos en la nube                                  |
| pytest                | Pruebas del backend FastAPI (sin DB real en tests)        |
| Node.js / Jest        | Backend legacy (conservado en `legacy/express-backend/`)  |

---

## Arquitectura actual

```
IngenioSnack/
├── backend/          # FastAPI — backend principal
├── client/           # React + Vite — frontend SPA
├── database/         # Schema SQL para Supabase/PostgreSQL
├── uploads/          # Imagenes de productos subidas
├── docs/             # Documentacion del proyecto
└── legacy/
    └── express-backend/  # Backend Node.js/Express (retirado)
        ├── server.js
        ├── src/
        └── tests/
```

---

## Levantar el entorno de desarrollo

### Backend (FastAPI)

```bash
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1   # Windows PowerShell
pip install -r requirements.txt
uvicorn app.main:app --reload
# Disponible en http://localhost:8000
# Swagger UI en http://localhost:8000/docs
```

### Frontend (React)

```bash
cd client
npm install
npm run dev
# Disponible en http://localhost:5173
# El proxy de Vite redirige /api → http://localhost:8000
```

### Tests del backend

```bash
cd backend
python -m pytest
```

---

## Conexion con Supabase

Configurar variables de entorno en `backend/.env` (copiar desde `backend/.env.example`):

```env
DATABASE_URL=postgresql+psycopg://USER:PASSWORD@HOST:PORT/DATABASE
SECRET_KEY=change_me_in_production
```

> El archivo `.env` esta en `.gitignore` y **no** se sube al repositorio.
> Los tests no requieren conexion real: usan SQLite en memoria.

---

## Metodologia XP aplicada

| Practica XP             | Evidencia en este proyecto                                    |
|-------------------------|---------------------------------------------------------------|
| **TDD**                 | Ciclo Red-Green-Refactor documentado en `EVIDENCIAS_TDD/`    |
| **Pair programming**    | 7 sesiones en `BITACORA_PAIR_PROGRAMMING.md`                 |
| **Releases pequeños**   | MVP funcional en 5 dias                                       |
| **Diseño simple**       | Sin frameworks, solo Node.js puro y Jest                      |
| **Propiedad colectiva** | Cualquier integrante modifica cualquier archivo               |
| **Integracion continua**| `npm test` ejecutado en cada commit                           |
| **Refactorizacion**     | 4 refactors documentados en `REFACTORIZACION.md`              |

---

## Historias de usuario implementadas

| ID    | Historia                                          | Prioridad | Estimacion | Estado     |
|-------|---------------------------------------------------|-----------|------------|------------|
| HU-01 | Identificacion del estudiante                     | Alta      | 3 pts      | ✅ Cerrada |
| HU-02 | Consulta del menu disponible                      | Alta      | 3 pts      | ✅ Cerrada |
| HU-03 | Pedido anticipado desde celular                   | Alta      | 5 pts      | ✅ Cerrada |
| HU-04 | Validacion de disponibilidad antes de confirmar   | Alta      | 5 pts      | ✅ Cerrada |
| HU-05 | Gestion rapida de disponibilidad (Sr. Julio)      | Alta      | 4 pts      | ✅ Cerrada |
| HU-06 | Pago contra entrega y cambio de estado            | Alta      | 3 pts      | ✅ Cerrada |
| HU-07 | Registro de sandwiches para fidelidad             | Media     | 5 pts      | ✅ Cerrada |

**Historias para siguiente iteracion:** HU-08 (productos mas vendidos), HU-09 (lista pedidos pendientes), interfaz web, base de datos real.

---

## Estructura del repositorio

```text
IngenioSnack/
├── backend/              - FastAPI — backend principal
│   ├── app/
│   │   ├── api/v1/       - endpoints por modulo
│   │   ├── core/         - config, database, security
│   │   ├── models/       - ORM SQLAlchemy
│   │   ├── repositories/ - acceso a datos
│   │   ├── schemas/      - Pydantic schemas
│   │   └── services/     - logica de negocio
│   └── tests/            - pytest (sin DB real)
├── client/               - React + Vite — frontend SPA
│   └── src/services/     - apiClient.js (adapter Express→FastAPI)
├── database/             - Schema SQL para Supabase/PostgreSQL
├── uploads/              - Imagenes de productos
├── docs/                 - Documentacion del proyecto
├── legacy/
│   └── express-backend/  - Backend Node.js/Express retirado
├── package.json
└── README.md
```

---

## Tecnologias utilizadas

| Herramienta | Version  | Uso                                  |
|-------------|----------|--------------------------------------|
| Node.js     | v22.x    | Runtime del servidor                 |
| Jest        | ^29.7.0  | Framework de pruebas unitarias (TDD) |
| JavaScript  | ES2020   | Lenguaje principal                   |

---

## Comandos de ejecucion

```bash
# Backend FastAPI
cd backend && uvicorn app.main:app --reload

# Frontend React
cd client && npm run dev

# Tests del backend
cd backend && python -m pytest

# Tests legacy (Express/Jest — conservados para referencia historica)
cd legacy/express-backend && npm test
```

---

## Estado final del MVP — Dia 5

```
Tests: 22/22 en verde ✅

menuService
  ✅ registrarProducto
  ✅ listarProductos
  ✅ listarProductosDisponibles
  ✅ cambiarDisponibilidadProducto

pedidoService
  ✅ crearPedido (con validacion de disponibilidad)
  ✅ validarDisponibilidadPedido
  ✅ confirmarPedido
  ✅ cambiarEstado (PENDIENTE → CONFIRMADO → EN_PREPARACION → LISTO → ENTREGADO)
  ✅ calcularTotalPedido
  ✅ calcularSubtotal
  ✅ agregarItemPedido

fidelidadService
  ✅ acreditarPuntos (1 punto por cada S/ 1 gastado)
  ✅ canjearPuntos
  ✅ registrarSandwich (10 sandwiches = 1 cafe gratis)
  ✅ obtenerBeneficios
  ✅ canjearCafeGratis
```

### Regla de negocio central (HU-04)

Solo se puede confirmar un pedido si **todos** los productos tienen `disponible: true`.
Si alguno esta agotado: *"El pedido contiene productos no disponibles"*.

### Programa de fidelidad (HU-07)

- 1 punto de fidelidad por cada S/ 1 gastado en pedidos entregados.
- Cada 10 sandwiches comprados y entregados: 1 cafe americano gratis.
- El contador se reinicia automaticamente al canjear el beneficio.

---

## Decisiones relevantes

- Pago **contra entrega** — sin integracion bancaria en esta iteracion.
- **Cafe americano gratis** es la recompensa (mencionada expresamente por el cliente).
- Identificacion por **codigo universitario** o correo institucional.
- Almacenamiento **en memoria** (MVP sin base de datos).

---

## Integrantes

| # | Nombre                            | Rol principal                |
|---|-----------------------------------|------------------------------|
| 1 | Artica Arias Gustavo Alonso       | Frontend y diseno visual      |
| 2 | Chavez Paquiyauri Jack Luis       | Backend y logica del sistema  |
| 3 | Flores Ccente Franklin David      | Tests, TDD y refactorizacion  |
| 4 | Jayo Mallqui Alexsander Antoni    | Documentacion y evidencias    |
| 5 | Raymundo Condor Frank Angel       | Integracion y soporte         |

---

*Practica desarrollada para entrega academica en ADESA — IS055B UNCP FIS*
