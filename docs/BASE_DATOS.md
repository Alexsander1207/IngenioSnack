# Base de Datos — IngenioSnack

## Motor y proveedor

- **Motor**: PostgreSQL (gestionado por Supabase)
- **ORM**: SQLAlchemy 2.x con driver `psycopg[binary]`
- **Esquema fuente**: `database/schema.sql`
- **Seed inicial**: `database/seed.sql`

> **Aviso importante**: si existe el archivo `supabase_setup.sql` en la raíz del proyecto, es un archivo legacy de una versión anterior. **No ejecutarlo** — puede causar conflictos con el esquema actual. Usar exclusivamente `database/schema.sql`.

---

## Tipos enumerados (ENUM)

| Tipo                      | Valores posibles                                                    |
|---------------------------|---------------------------------------------------------------------|
| `usuario_rol`             | `ADMIN`, `ESTUDIANTE`                                               |
| `pedido_estado`           | `PENDIENTE`, `PREPARANDO`, `LISTO`, `RECOGIDO`, `CANCELADO`        |
| `movimiento_stock_tipo`   | `INGRESO`, `SALIDA`, `AJUSTE`                                       |
| `fidelidad_movimiento_tipo` | `ACREDITACION_PEDIDO`, `AJUSTE_ADMIN`, `CANJE`, `REVERSA`        |
| `fidelidad_regla_tipo`    | `PRINCIPAL`, `PRODUCTO`, `PROMOCION`                                |

---

## Tablas principales

### `usuarios`

Almacena todos los usuarios del sistema (administradores y estudiantes).

| Columna            | Tipo           | Constraints                            |
|--------------------|----------------|----------------------------------------|
| `id`               | uuid           | PK, default `gen_random_uuid()`        |
| `nombre`           | text           | NOT NULL                               |
| `correo`           | text           | NOT NULL, UNIQUE                       |
| `codigo_estudiante`| text           | UNIQUE, nullable                       |
| `hashed_password`  | text           | NOT NULL                               |
| `rol`              | usuario_rol    | NOT NULL, default `ESTUDIANTE`         |
| `activo`           | boolean        | NOT NULL, default `true`               |
| `created_at`       | timestamptz    | NOT NULL, default `now()`              |
| `updated_at`       | timestamptz    | NOT NULL, default `now()`              |

---

### `categorias`

Categorías para organizar el menú.

| Columna      | Tipo        | Constraints                     |
|--------------|-------------|---------------------------------|
| `id`         | uuid        | PK                              |
| `nombre`     | text        | NOT NULL, UNIQUE                |
| `slug`       | text        | NOT NULL, UNIQUE                |
| `descripcion`| text        | nullable                        |
| `activo`     | boolean     | NOT NULL, default `true`        |
| `created_at` | timestamptz | NOT NULL                        |
| `updated_at` | timestamptz | NOT NULL                        |

---

### `productos`

Productos disponibles en el menú de la cafetería.

| Columna        | Tipo           | Constraints                                      |
|----------------|----------------|--------------------------------------------------|
| `id`           | uuid           | PK                                               |
| `nombre`       | text           | NOT NULL                                         |
| `descripcion`  | text           | nullable                                         |
| `precio`       | numeric(10,2)  | NOT NULL, CHECK `precio >= 0`                    |
| `categoria`    | text           | nullable (campo texto legacy)                    |
| `categoria_id` | uuid           | FK → `categorias(id)` ON DELETE SET NULL, nullable |
| `imagen_url`   | text           | nullable                                         |
| `stock`        | integer        | NOT NULL, default `0`, CHECK `stock >= 0`        |
| `disponible`   | boolean        | NOT NULL, default `true`                         |
| `activo`       | boolean        | NOT NULL, default `true`                         |
| `created_at`   | timestamptz    | NOT NULL                                         |
| `updated_at`   | timestamptz    | NOT NULL                                         |

> `categoria_id` es nullable para mantener compatibilidad con registros anteriores que usan el campo texto `categoria`.

---

### `promociones`

Combos y promociones especiales con precio fijo y fechas de vigencia.

| Columna       | Tipo          | Constraints                          |
|---------------|---------------|--------------------------------------|
| `id`          | uuid          | PK                                   |
| `nombre`      | text          | NOT NULL                             |
| `descripcion` | text          | nullable                             |
| `precio`      | numeric(10,2) | NOT NULL, CHECK `precio >= 0`        |
| `imagen_url`  | text          | nullable                             |
| `disponible`  | boolean       | NOT NULL, default `true`             |
| `activo`      | boolean       | NOT NULL, default `true`             |
| `fecha_inicio`| timestamptz   | nullable                             |
| `fecha_fin`   | timestamptz   | nullable                             |
| `created_at`  | timestamptz   | NOT NULL                             |
| `updated_at`  | timestamptz   | NOT NULL                             |

---

### `pedidos`

Cabecera de cada pedido realizado por un estudiante.

| Columna               | Tipo          | Constraints                                |
|-----------------------|---------------|--------------------------------------------|
| `id`                  | uuid          | PK                                         |
| `codigo`              | text          | NOT NULL, UNIQUE                           |
| `usuario_id`          | uuid          | NOT NULL, FK → `usuarios(id)` ON DELETE RESTRICT |
| `estado`              | pedido_estado | NOT NULL, default `PENDIENTE`              |
| `subtotal`            | numeric(10,2) | NOT NULL, default `0`, CHECK `>= 0`        |
| `descuento`           | numeric(10,2) | NOT NULL, default `0`, CHECK `>= 0`        |
| `total`               | numeric(10,2) | NOT NULL, default `0`, CHECK `>= 0`        |
| `fidelidad_acreditada`| boolean       | NOT NULL, default `false`                  |
| `notas`               | text          | nullable                                   |
| `created_at`          | timestamptz   | NOT NULL                                   |
| `updated_at`          | timestamptz   | NOT NULL                                   |

---

### `items_pedido`

Líneas de detalle de cada pedido. Soporta tanto productos sueltos como promociones.

| Columna          | Tipo          | Constraints                                                    |
|------------------|---------------|----------------------------------------------------------------|
| `id`             | uuid          | PK                                                             |
| `pedido_id`      | uuid          | NOT NULL, FK → `pedidos(id)` ON DELETE CASCADE                 |
| `producto_id`    | uuid          | FK → `productos(id)` ON DELETE RESTRICT, nullable              |
| `promocion_id`   | uuid          | FK → `promociones(id)` ON DELETE RESTRICT, nullable            |
| `nombre_producto`| text          | NOT NULL (snapshot del nombre al momento del pedido)           |
| `cantidad`       | integer       | NOT NULL, CHECK `cantidad > 0`                                 |
| `precio_unitario`| numeric(10,2) | NOT NULL, CHECK `>= 0`                                         |
| `subtotal`       | numeric(10,2) | NOT NULL, CHECK `>= 0`                                         |
| `created_at`     | timestamptz   | NOT NULL                                                       |

**Constraint:** `producto_id IS NOT NULL OR promocion_id IS NOT NULL` — cada ítem debe referenciar un producto o una promoción.

---

### `movimientos_stock`

Historial de todos los cambios de stock (ingresos, salidas, ajustes).

| Columna         | Tipo                    | Constraints                                      |
|-----------------|-------------------------|--------------------------------------------------|
| `id`            | uuid                    | PK                                               |
| `producto_id`   | uuid                    | NOT NULL, FK → `productos(id)` ON DELETE RESTRICT|
| `pedido_id`     | uuid                    | FK → `pedidos(id)` ON DELETE SET NULL, nullable  |
| `tipo`          | movimiento_stock_tipo   | NOT NULL                                         |
| `cantidad`      | integer                 | NOT NULL, CHECK `cantidad > 0`                   |
| `stock_anterior`| integer                 | nullable                                         |
| `stock_nuevo`   | integer                 | nullable                                         |
| `motivo`        | text                    | nullable                                         |
| `created_at`    | timestamptz             | NOT NULL                                         |

---

### `fidelidad_movimientos`

Registro de todos los movimientos de puntos y sellos por usuario.

| Columna          | Tipo                        | Constraints                                           |
|------------------|-----------------------------|-------------------------------------------------------|
| `id`             | uuid                        | PK                                                    |
| `usuario_id`     | uuid                        | NOT NULL, FK → `usuarios(id)` ON DELETE RESTRICT      |
| `pedido_id`      | uuid                        | FK → `pedidos(id)` ON DELETE SET NULL, nullable        |
| `tipo_movimiento`| fidelidad_movimiento_tipo   | NOT NULL                                              |
| `puntos`         | integer                     | NOT NULL, default `0`                                 |
| `sellos`         | integer                     | NOT NULL, default `0`                                 |
| `descripcion`    | text                        | nullable                                              |
| `created_at`     | timestamptz                 | NOT NULL                                              |

---

### `fidelidad_reglas`

Configuración de las reglas del programa de fidelidad (una regla PRINCIPAL activa).

| Columna               | Tipo                  | Constraints                                        |
|-----------------------|-----------------------|----------------------------------------------------|
| `id`                  | uuid                  | PK                                                 |
| `nombre`              | text                  | NOT NULL                                           |
| `tipo`                | fidelidad_regla_tipo  | NOT NULL, default `PRINCIPAL`                      |
| `puntos_por_sol`      | numeric(10,2)         | NOT NULL, default `1`, CHECK `>= 0`                |
| `sellos_por_pedido`   | integer               | NOT NULL, default `1`, CHECK `>= 0`                |
| `puntos_canje_cafe`   | integer               | NOT NULL, default `0`, CHECK `>= 0`                |
| `sellos_canje_cafe`   | integer               | NOT NULL, default `10`, CHECK `>= 0`               |
| `producto_criterio_id`| uuid                  | FK → `productos(id)` ON DELETE SET NULL, nullable  |
| `cantidad_criterio`   | integer               | nullable, CHECK `> 0` si no nulo                   |
| `producto_premio_id`  | uuid                  | FK → `productos(id)` ON DELETE SET NULL, nullable  |
| `activo`              | boolean               | NOT NULL, default `true`                           |
| `created_at`          | timestamptz           | NOT NULL                                           |
| `updated_at`          | timestamptz           | NOT NULL                                           |

---

## Relaciones

```
usuarios ──< pedidos ──< items_pedido >── productos
                │                    └──> promociones
                └──< fidelidad_movimientos

productos ──< movimientos_stock
categorias ──< productos (categoria_id)

fidelidad_reglas >── productos (producto_criterio_id)
fidelidad_reglas >── productos (producto_premio_id)
```

---

## Índices

| Índice                                  | Tabla                   | Columnas                          | Tipo      |
|-----------------------------------------|-------------------------|-----------------------------------|-----------|
| `idx_usuarios_rol`                      | usuarios                | rol                               | B-Tree    |
| `idx_productos_activo_disponible`       | productos               | activo, disponible                | B-Tree    |
| `idx_pedidos_usuario_id`               | pedidos                 | usuario_id                        | B-Tree    |
| `idx_pedidos_estado`                   | pedidos                 | estado                            | B-Tree    |
| `idx_items_pedido_pedido_id`           | items_pedido            | pedido_id                         | B-Tree    |
| `idx_movimientos_stock_producto_id`    | movimientos_stock       | producto_id                       | B-Tree    |
| `idx_fidelidad_movimientos_usuario_id` | fidelidad_movimientos   | usuario_id                        | B-Tree    |
| `idx_fidelidad_movimientos_pedido_id`  | fidelidad_movimientos   | pedido_id                         | B-Tree    |
| `uq_fidelidad_acreditacion_pedido`     | fidelidad_movimientos   | pedido_id, tipo_movimiento        | UNIQUE parcial (pedido_id IS NOT NULL) |
| `uq_fidelidad_regla_principal_activa`  | fidelidad_reglas        | tipo                              | UNIQUE parcial (activo=true, tipo='PRINCIPAL') |
| `idx_categorias_slug`                  | categorias              | slug                              | B-Tree    |
| `idx_productos_categoria_id`           | productos               | categoria_id                      | B-Tree    |

---

## Seed inicial

El archivo `database/seed.sql` es **idempotente** — se puede ejecutar múltiples veces sin duplicar datos (`ON CONFLICT DO NOTHING`).

**Cómo ejecutarlo en Supabase:**

1. Abrir el proyecto en Supabase → SQL Editor → New query.
2. Pegar el contenido completo de `database/seed.sql`.
3. Ejecutar.

**Datos que inserta:**

| Tabla              | Registros                                                      |
|--------------------|----------------------------------------------------------------|
| usuarios           | Admin dev + Estudiante dev (passwords placeholder, no válidos) |
| categorias         | Bebidas, Sandwiches, Snacks                                    |
| productos          | Café americano, Sandwich de pollo, Brownie                     |
| promociones        | Combo café y brownie, Menú estudiante                          |
| fidelidad_reglas   | Regla principal: 1 punto/sol, 10 sellos = 1 café gratis        |
| movimientos_stock  | Stock inicial de los 3 productos                               |

> Los hashes de contraseña en el seed son **placeholders no válidos**. Para activar el login se deben generar hashes reales usando `backend/scripts/generate_dev_password_hash.py`.
