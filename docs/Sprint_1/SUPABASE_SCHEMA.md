# Esquema de Supabase — Sprint 1

**Proyecto:** IngenioSnack
**Project ref:** `tyizpovszxxdtkoeqqkm`
**URL:** https://tyizpovszxxdtkoeqqkm.supabase.co
**Region:** us-east-1

Este documento describe la base de datos del Sprint 1, enfocada en la gestion de
productos del menu (HU-01 y HU-04).

---

## Tabla `productos`

Menu de IngenioSnack. **Los productos no se eliminan: se desactivan** (`activo = false`).

| Campo                  | Tipo            | Restricciones / Default            | Descripcion                                   |
|------------------------|-----------------|------------------------------------|-----------------------------------------------|
| `id`                   | `uuid`          | PK, default `gen_random_uuid()`    | Identificador unico del producto.             |
| `nombre`               | `text`          | `not null`                         | Nombre del producto.                          |
| `descripcion`          | `text`          | opcional                           | Descripcion corta.                            |
| `precio`               | `numeric(10,2)` | `not null`, `check (precio > 0)`   | Precio en soles. No puede ser <= 0.           |
| `categoria`            | `text`          | opcional                           | Categoria (Sandwich, Bebida, Snack, etc.).    |
| `imagen_url`           | `text`          | opcional                           | URL de la imagen del producto.                |
| `disponible`           | `boolean`       | `not null`, default `true`         | Si el estudiante puede pedirlo ahora.         |
| `activo`               | `boolean`       | `not null`, default `true`         | Baja logica. `false` = retirado del menu.     |
| `motivo_no_disponible` | `text`          | opcional                           | Razon cuando `disponible = false`.            |
| `creado_en`            | `timestamptz`   | `not null`, default `now()`        | Fecha de creacion.                            |

### SQL de creacion

```sql
create extension if not exists "pgcrypto";

create table if not exists public.productos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  descripcion text,
  precio numeric(10,2) not null check (precio > 0),
  categoria text,
  imagen_url text,
  disponible boolean not null default true,
  activo boolean not null default true,
  motivo_no_disponible text,
  creado_en timestamptz not null default now()
);
```

---

## Reglas de negocio (aplicadas en BD y en `productoService.js`)

- **Nombre obligatorio:** `nombre text not null` + validacion en el servicio.
- **Precio valido:** `check (precio > 0)` + validacion en el servicio.
- **No se elimina, se desactiva:** no existe operacion de DELETE; se usa `activo = false`.
- **Vista del estudiante:** solo productos con `activo = true` y `disponible = true`.

---

## Seguridad (RLS)

Row Level Security esta **habilitado**. Politicas actuales:

| Politica                  | Operacion | Regla        | Estado |
|---------------------------|-----------|--------------|--------|
| `productos_select_publico`| SELECT    | `using (true)` | Lectura publica del menu. |
| `productos_insert_dev`    | INSERT    | `with check (true)` | Permisiva (desarrollo). |
| `productos_update_dev`    | UPDATE    | `using/check (true)` | Permisiva (desarrollo). |
| (ninguna)                 | DELETE    | —            | Sin policy: los productos no se borran. |

> ⚠️ **Pendiente de seguridad (Sprint posterior):** las politicas de INSERT y UPDATE
> son permisivas para facilitar el desarrollo. Antes de produccion deben restringirse
> a usuarios autenticados (rol del dueño), por ejemplo con `auth.role() = 'authenticated'`.
> El linter de Supabase ya las reporta como `rls_policy_always_true`.

---

## Conexion desde el codigo

- Cliente: `src/config/supabaseClient.js` (lee `SUPABASE_URL` y `SUPABASE_ANON_KEY` del `.env`).
- Servicio: `src/services/productoService.js`.
- Variables de entorno: ver `.env.example`.
