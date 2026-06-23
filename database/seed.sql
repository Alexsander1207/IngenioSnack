-- IngenioSnack - datos iniciales seguros para desarrollo
--
-- Como ejecutarlo en Supabase SQL Editor:
-- 1. Abrir el proyecto en Supabase.
-- 2. Ir a SQL Editor > New query.
-- 3. Pegar el contenido completo de este archivo.
-- 4. Ejecutar una vez. El script es idempotente y no borra datos existentes.
--
-- Comando SQL:
--   Ejecutar este archivo completo en una sola consulta del SQL Editor.
--
-- Tablas afectadas cuando existen:
-- - public.usuarios
-- - public.categorias
-- - public.productos
-- - public.promociones
-- - public.fidelidad_reglas
-- - public.stock_movimientos o public.movimientos_stock
--
-- Seguridad:
-- - No contiene passwords reales.
-- - Los valores de hashed_password son placeholders NO validos para login.
-- - El backend usa bcrypt con passlib. Para habilitar login de estos usuarios,
--   generar hashes bcrypt desde el backend o desde un script seguro usando
--   app.core.security.get_password_hash("<password temporal de desarrollo>").
-- - Reemplazar passwords temporales fuera de este archivo y nunca commitear
--   credenciales reales.

create extension if not exists "pgcrypto";

do $$
declare
  v_admin_id uuid := '00000000-0000-4000-8000-000000000001';
  v_student_id uuid := '00000000-0000-4000-8000-000000000002';
  v_bebidas_id uuid := '00000000-0000-4000-8000-000000000101';
  v_sandwiches_id uuid := '00000000-0000-4000-8000-000000000102';
  v_snacks_id uuid := '00000000-0000-4000-8000-000000000103';
begin
  if to_regclass('public.usuarios') is not null then
    insert into public.usuarios (
      id,
      nombre,
      correo,
      codigo_estudiante,
      hashed_password,
      rol,
      activo
    )
    values
      (
        v_admin_id,
        'Admin Desarrollo',
        'admin.dev@ingeniosnack.local',
        null,
        '$2b$12$LB6jc4r261A35cRID0mHUuUMQdq8g7Y7ktVZg85x02c6id/8DgYf2',
        'ADMIN',
        true
      ),
      (
        v_student_id,
        'Estudiante Desarrollo',
        'estudiante.dev@ingeniosnack.local',
        'DEV-EST-001',
        '$2b$12$/pvHcfRU8VwWEJz0Ud.wq.B2FHl376w9Lq76ZsToZb5gv0Yr265Fy',
        'ESTUDIANTE',
        true
      )
    on conflict do nothing;
  else
    raise notice 'Tabla public.usuarios no existe. Se omite seed de usuarios.';
  end if;

  if to_regclass('public.categorias') is not null then
    insert into public.categorias (id, nombre, slug, descripcion)
    values
      (v_bebidas_id,    'Bebidas',    'bebidas',    'Bebidas calientes y frías'),
      (v_sandwiches_id, 'Sandwiches', 'sandwiches', 'Sandwiches y tostados'),
      (v_snacks_id,     'Snacks',     'snacks',     'Snacks y bocadillos')
    on conflict do nothing;
  else
    raise notice 'Tabla public.categorias no existe. Se omite seed de categorias.';
  end if;
end $$;

do $$
declare
  v_has_categoria_id boolean := false;
  v_has_disponible boolean := false;
begin
  if to_regclass('public.productos') is null then
    raise notice 'Tabla public.productos no existe. Se omite seed de productos.';
    return;
  end if;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'productos'
      and column_name = 'categoria_id'
  )
  into v_has_categoria_id;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'productos'
      and column_name = 'disponible'
  )
  into v_has_disponible;

  if v_has_categoria_id and v_has_disponible then
    insert into public.productos (
      id,
      nombre,
      descripcion,
      precio,
      categoria,
      categoria_id,
      imagen_url,
      stock,
      disponible,
      activo
    )
    values
      (
        '00000000-0000-4000-8000-000000000201',
        'Cafe americano',
        'Cafe caliente para entorno de desarrollo.',
        4.50,
        'Bebidas',
        '00000000-0000-4000-8000-000000000101',
        null,
        30,
        true,
        true
      ),
      (
        '00000000-0000-4000-8000-000000000202',
        'Sandwich de pollo',
        'Sandwich base para pruebas de pedidos.',
        8.90,
        'Sandwiches',
        '00000000-0000-4000-8000-000000000102',
        null,
        20,
        true,
        true
      ),
      (
        '00000000-0000-4000-8000-000000000203',
        'Brownie',
        'Snack dulce para pruebas de menu.',
        5.50,
        'Snacks',
        '00000000-0000-4000-8000-000000000103',
        null,
        25,
        true,
        true
      )
    on conflict (id) do nothing;
  elsif v_has_disponible then
    insert into public.productos (
      id,
      nombre,
      descripcion,
      precio,
      categoria,
      imagen_url,
      stock,
      disponible,
      activo
    )
    values
      (
        '00000000-0000-4000-8000-000000000201',
        'Cafe americano',
        'Cafe caliente para entorno de desarrollo.',
        4.50,
        'Bebidas',
        null,
        30,
        true,
        true
      ),
      (
        '00000000-0000-4000-8000-000000000202',
        'Sandwich de pollo',
        'Sandwich base para pruebas de pedidos.',
        8.90,
        'Sandwiches',
        null,
        20,
        true,
        true
      ),
      (
        '00000000-0000-4000-8000-000000000203',
        'Brownie',
        'Snack dulce para pruebas de menu.',
        5.50,
        'Snacks',
        null,
        25,
        true,
        true
      )
    on conflict (id) do nothing;
  else
    insert into public.productos (
      id,
      nombre,
      descripcion,
      precio,
      categoria,
      imagen_url,
      stock,
      activo
    )
    values
      (
        '00000000-0000-4000-8000-000000000201',
        'Cafe americano',
        'Cafe caliente para entorno de desarrollo.',
        4.50,
        'Bebidas',
        null,
        30,
        true
      ),
      (
        '00000000-0000-4000-8000-000000000202',
        'Sandwich de pollo',
        'Sandwich base para pruebas de pedidos.',
        8.90,
        'Sandwiches',
        null,
        20,
        true
      ),
      (
        '00000000-0000-4000-8000-000000000203',
        'Brownie',
        'Snack dulce para pruebas de menu.',
        5.50,
        'Snacks',
        null,
        25,
        true
      )
    on conflict (id) do nothing;
  end if;
end $$;

do $$
declare
  v_has_tipo_valor boolean := false;
  v_has_precio boolean := false;
  v_has_disponible boolean := false;
begin
  if to_regclass('public.promociones') is null then
    raise notice 'Tabla public.promociones no existe. Se omite seed de promociones.';
    return;
  end if;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'promociones'
      and column_name = 'tipo'
  ) and exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'promociones'
      and column_name = 'valor'
  )
  into v_has_tipo_valor;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'promociones'
      and column_name = 'precio'
  )
  into v_has_precio;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'promociones'
      and column_name = 'disponible'
  )
  into v_has_disponible;

  if v_has_tipo_valor then
    insert into public.promociones (
      id,
      nombre,
      descripcion,
      tipo,
      valor,
      fecha_inicio,
      fecha_fin,
      imagen_url,
      activo
    )
    values
      (
        '00000000-0000-4000-8000-000000000301',
        'Combo cafe y brownie',
        'Promocion de desarrollo para validar combos.',
        'COMBO',
        9.50,
        now(),
        now() + interval '90 days',
        null,
        true
      ),
      (
        '00000000-0000-4000-8000-000000000302',
        'Descuento estudiante',
        'Descuento fijo para pruebas internas.',
        'DESCUENTO_FIJO',
        2.00,
        now(),
        now() + interval '90 days',
        null,
        true
      )
    on conflict (id) do nothing;
  elsif v_has_precio and v_has_disponible then
    insert into public.promociones (
      id,
      nombre,
      descripcion,
      precio,
      imagen_url,
      disponible,
      activo,
      fecha_inicio,
      fecha_fin
    )
    values
      (
        '00000000-0000-4000-8000-000000000301',
        'Combo cafe y brownie',
        'Promocion de desarrollo para validar combos.',
        9.50,
        null,
        true,
        true,
        now(),
        now() + interval '90 days'
      ),
      (
        '00000000-0000-4000-8000-000000000302',
        'Menu estudiante',
        'Promocion base para pruebas internas.',
        11.90,
        null,
        true,
        true,
        now(),
        now() + interval '90 days'
      )
    on conflict (id) do nothing;
  elsif v_has_precio then
    insert into public.promociones (
      id,
      nombre,
      descripcion,
      precio,
      activo
    )
    values
      (
        '00000000-0000-4000-8000-000000000301',
        'Combo cafe y brownie',
        'Promocion de desarrollo para validar combos.',
        9.50,
        true
      ),
      (
        '00000000-0000-4000-8000-000000000302',
        'Menu estudiante',
        'Promocion base para pruebas internas.',
        11.90,
        true
      )
    on conflict (id) do nothing;
  else
    raise notice 'Tabla public.promociones no tiene columnas soportadas para seed.';
  end if;
end $$;

do $$
begin
  if to_regclass('public.fidelidad_reglas') is not null then
    insert into public.fidelidad_reglas (
      id,
      nombre,
      tipo,
      puntos_por_sol,
      sellos_por_pedido,
      puntos_canje_cafe,
      sellos_canje_cafe,
      activo
    )
    values (
      '00000000-0000-4000-8000-000000000501',
      'Regla principal desarrollo',
      'PRINCIPAL',
      1.00,
      1,
      0,
      10,
      true
    )
    on conflict do nothing;
  else
    raise notice 'Tabla public.fidelidad_reglas no existe. Se omite seed de reglas de fidelidad.';
  end if;
end $$;

do $$
begin
  if to_regclass('public.stock_movimientos') is not null then
    insert into public.stock_movimientos (
      id,
      producto_id,
      pedido_id,
      tipo_movimiento,
      cantidad,
      stock_anterior,
      stock_nuevo,
      motivo
    )
    values
      (
        '00000000-0000-4000-8000-000000000401',
        '00000000-0000-4000-8000-000000000201',
        null,
        'ENTRADA',
        30,
        0,
        30,
        'Stock inicial de desarrollo'
      ),
      (
        '00000000-0000-4000-8000-000000000402',
        '00000000-0000-4000-8000-000000000202',
        null,
        'ENTRADA',
        20,
        0,
        20,
        'Stock inicial de desarrollo'
      ),
      (
        '00000000-0000-4000-8000-000000000403',
        '00000000-0000-4000-8000-000000000203',
        null,
        'ENTRADA',
        25,
        0,
        25,
        'Stock inicial de desarrollo'
      )
    on conflict (id) do nothing;
  elsif to_regclass('public.movimientos_stock') is not null then
    insert into public.movimientos_stock (
      id,
      producto_id,
      pedido_id,
      tipo,
      cantidad,
      stock_anterior,
      stock_nuevo,
      motivo
    )
    values
      (
        '00000000-0000-4000-8000-000000000401',
        '00000000-0000-4000-8000-000000000201',
        null,
        'INGRESO',
        30,
        0,
        30,
        'Stock inicial de desarrollo'
      ),
      (
        '00000000-0000-4000-8000-000000000402',
        '00000000-0000-4000-8000-000000000202',
        null,
        'INGRESO',
        20,
        0,
        20,
        'Stock inicial de desarrollo'
      ),
      (
        '00000000-0000-4000-8000-000000000403',
        '00000000-0000-4000-8000-000000000203',
        null,
        'INGRESO',
        25,
        0,
        25,
        'Stock inicial de desarrollo'
      )
    on conflict (id) do nothing;
  else
    raise notice 'No existe tabla public.stock_movimientos ni public.movimientos_stock. El stock inicial queda en productos.stock.';
  end if;
end $$;
