-- =============================================================================
-- NO EJECUTAR EN SUPABASE.
-- Este es el esquema LEGACY del backend Express (Node.js).
-- Usa la tabla `estudiantes` en lugar de `usuarios` y es INCOMPATIBLE
-- con el backend FastAPI actual y con database/schema.sql.
--
-- Fuente de verdad actual: database/schema.sql
-- Datos iniciales:         database/seed.sql
-- =============================================================================

-- Habilitar la extensión para UUID si no está habilitada
create extension if not exists "uuid-ossp";

-- 1. Tabla de Estudiantes
create table if not exists estudiantes (
  id text primary key,
  nombre text not null,
  codigo text not null unique,
  correo text not null unique,
  password text not null,
  puntos integer not null default 0,
  sandwiches integer not null default 0,
  cafes_gratis integer not null default 0,
  creado_en timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Tabla de Categorías
create table if not exists categorias (
  id uuid default gen_random_uuid() primary key,
  nombre text not null unique,
  creado_en timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Tabla de Productos
create table if not exists productos (
  id uuid default gen_random_uuid() primary key,
  nombre text not null,
  descripcion text,
  precio numeric not null check (precio > 0),
  categoria text,
  imagen_url text,
  disponible boolean not null default true,
  activo boolean not null default true,
  motivo_no_disponible text,
  stock integer not null default 15,
  categoria_id uuid references categorias(id) on delete set null,
  creado_en timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Tabla de Pedidos
create table if not exists pedidos (
  id text primary key, -- ej: PED-0001
  estudiante_id text references estudiantes(id) on delete cascade,
  estado text not null default 'PENDIENTE',
  total numeric not null default 0,
  creado_en timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Tabla de Items de Pedido
create table if not exists items_pedido (
  id uuid default gen_random_uuid() primary key,
  pedido_id text references pedidos(id) on delete cascade,
  producto_id uuid references productos(id) on delete cascade,
  cantidad integer not null check (cantidad >= 1),
  precio_unitario numeric not null check (precio_unitario >= 0)
);

-- 6. Tabla de Promociones (Combos)
create table if not exists promociones (
  id uuid default gen_random_uuid() primary key,
  nombre text not null,
  descripcion text,
  precio numeric not null check (precio > 0),
  disponible boolean not null default true,
  activo boolean not null default true,
  creado_en timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. Tabla intermedia para asociar productos a una promoción
create table if not exists items_promocion (
  id uuid default gen_random_uuid() primary key,
  promocion_id uuid references promociones(id) on delete cascade,
  producto_id uuid references productos(id) on delete cascade,
  cantidad integer not null default 1 check (cantidad >= 1)
);

-- 8. Tabla para definir Reglas de Premios de Fidelidad Dinámicas
create table if not exists reglas_fidelidad (
  id uuid default gen_random_uuid() primary key,
  nombre text not null,
  producto_criterio_id uuid references productos(id) on delete cascade,
  cantidad_criterio integer not null check (cantidad_criterio >= 1),
  producto_premio_id uuid references productos(id) on delete cascade,
  activo boolean not null default true,
  creado_en timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 9. Tabla para almacenar los contadores de progreso de cada estudiante
create table if not exists progreso_fidelidad (
  id uuid default gen_random_uuid() primary key,
  estudiante_id text references estudiantes(id) on delete cascade,
  producto_criterio_id uuid references productos(id) on delete cascade,
  cantidad_acumulada integer not null default 0,
  premios_disponibles integer not null default 0,
  unique(estudiante_id, producto_criterio_id)
);

-- Habilitar replicación en tiempo real para la tabla de pedidos
alter publication supabase_realtime add table public.pedidos;
