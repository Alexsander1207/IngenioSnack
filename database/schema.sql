-- IngenioSnack - propuesta inicial de esquema PostgreSQL/Supabase
-- Fase 2: archivo preparado, no ejecutado contra Supabase.

create extension if not exists "pgcrypto";

do $$
begin
  if not exists (select 1 from pg_type where typname = 'usuario_rol') then
    create type usuario_rol as enum ('ADMIN', 'ESTUDIANTE');
  end if;

  if not exists (select 1 from pg_type where typname = 'pedido_estado') then
    create type pedido_estado as enum (
      'PENDIENTE',
      'PREPARANDO',
      'LISTO',
      'RECOGIDO',
      'CANCELADO'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'movimiento_stock_tipo') then
    create type movimiento_stock_tipo as enum ('INGRESO', 'SALIDA', 'AJUSTE');
  end if;

  if not exists (select 1 from pg_type where typname = 'fidelidad_movimiento_tipo') then
    create type fidelidad_movimiento_tipo as enum (
      'ACREDITACION_PEDIDO',
      'AJUSTE_ADMIN',
      'CANJE',
      'REVERSA'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'fidelidad_regla_tipo') then
    create type fidelidad_regla_tipo as enum ('PRINCIPAL', 'PRODUCTO', 'PROMOCION');
  end if;
end $$;

alter type fidelidad_movimiento_tipo add value if not exists 'ACREDITACION_PEDIDO';
alter type fidelidad_movimiento_tipo add value if not exists 'AJUSTE_ADMIN';
alter type fidelidad_movimiento_tipo add value if not exists 'CANJE';
alter type fidelidad_movimiento_tipo add value if not exists 'REVERSA';

create table if not exists usuarios (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  correo text not null unique,
  codigo_estudiante text unique,
  hashed_password text not null,
  rol usuario_rol not null default 'ESTUDIANTE',
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists productos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  descripcion text,
  precio numeric(10, 2) not null check (precio >= 0),
  categoria text,
  imagen_url text,
  stock integer not null default 0 check (stock >= 0),
  disponible boolean not null default true,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists promociones (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  descripcion text,
  precio numeric(10, 2) not null check (precio >= 0),
  imagen_url text,
  disponible boolean not null default true,
  activo boolean not null default true,
  fecha_inicio timestamptz,
  fecha_fin timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists pedidos (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  usuario_id uuid not null references usuarios(id) on delete restrict,
  estado pedido_estado not null default 'PENDIENTE',
  subtotal numeric(10, 2) not null default 0 check (subtotal >= 0),
  descuento numeric(10, 2) not null default 0 check (descuento >= 0),
  total numeric(10, 2) not null default 0 check (total >= 0),
  fidelidad_acreditada boolean not null default false,
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists items_pedido (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references pedidos(id) on delete cascade,
  producto_id uuid references productos(id) on delete restrict,
  promocion_id uuid null references promociones(id) on delete restrict,
  nombre_producto text not null,
  cantidad integer not null check (cantidad > 0),
  precio_unitario numeric(10, 2) not null check (precio_unitario >= 0),
  subtotal numeric(10, 2) not null check (subtotal >= 0),
  created_at timestamptz not null default now(),
  constraint items_pedido_producto_o_promocion_chk check (
    producto_id is not null or promocion_id is not null
  )
);

create table if not exists movimientos_stock (
  id uuid primary key default gen_random_uuid(),
  producto_id uuid not null references productos(id) on delete restrict,
  pedido_id uuid references pedidos(id) on delete set null,
  tipo movimiento_stock_tipo not null,
  cantidad integer not null check (cantidad > 0),
  stock_anterior integer,
  stock_nuevo integer,
  motivo text,
  created_at timestamptz not null default now()
);

create table if not exists fidelidad_movimientos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references usuarios(id) on delete restrict,
  pedido_id uuid references pedidos(id) on delete set null,
  tipo_movimiento fidelidad_movimiento_tipo not null,
  puntos integer not null default 0,
  sellos integer not null default 0,
  descripcion text,
  created_at timestamptz not null default now()
);

do $$
begin
  if to_regclass('public.fidelidad_movimientos') is not null then
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public'
        and table_name = 'fidelidad_movimientos'
        and column_name = 'tipo'
    ) and not exists (
      select 1 from information_schema.columns
      where table_schema = 'public'
        and table_name = 'fidelidad_movimientos'
        and column_name = 'tipo_movimiento'
    ) then
      alter table fidelidad_movimientos rename column tipo to tipo_movimiento;
    end if;

    alter table fidelidad_movimientos
      add column if not exists sellos integer not null default 0;
  end if;
end $$;

create table if not exists fidelidad_reglas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  tipo fidelidad_regla_tipo not null default 'PRINCIPAL',
  puntos_por_sol numeric(10, 2) not null default 1 check (puntos_por_sol >= 0),
  sellos_por_pedido integer not null default 1 check (sellos_por_pedido >= 0),
  puntos_canje_cafe integer not null default 0 check (puntos_canje_cafe >= 0),
  sellos_canje_cafe integer not null default 10 check (sellos_canje_cafe >= 0),
  producto_criterio_id uuid null references productos(id) on delete set null,
  cantidad_criterio integer null check (cantidad_criterio is null or cantidad_criterio > 0),
  producto_premio_id uuid null references productos(id) on delete set null,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists categorias (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  slug text not null unique,
  descripcion text,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- categoria_id is nullable to preserve existing productos rows that use the free-text `categoria` column
alter table productos
  add column if not exists categoria_id uuid null references categorias(id) on delete set null;

create index if not exists idx_usuarios_rol on usuarios(rol);
create index if not exists idx_productos_activo_disponible on productos(activo, disponible);
create index if not exists idx_pedidos_usuario_id on pedidos(usuario_id);
create index if not exists idx_pedidos_estado on pedidos(estado);
create index if not exists idx_items_pedido_pedido_id on items_pedido(pedido_id);
create index if not exists idx_movimientos_stock_producto_id on movimientos_stock(producto_id);
create index if not exists idx_fidelidad_movimientos_usuario_id on fidelidad_movimientos(usuario_id);
create index if not exists idx_fidelidad_movimientos_pedido_id on fidelidad_movimientos(pedido_id);
create unique index if not exists uq_fidelidad_acreditacion_pedido
  on fidelidad_movimientos(pedido_id, tipo_movimiento)
  where pedido_id is not null;
create unique index if not exists uq_fidelidad_regla_principal_activa
  on fidelidad_reglas((tipo))
  where activo is true and tipo = 'PRINCIPAL';
create index if not exists idx_fidelidad_reglas_activo on fidelidad_reglas(activo);
create index if not exists idx_categorias_slug on categorias(slug);
create index if not exists idx_productos_categoria_id on productos(categoria_id);
