/**
 * Pruebas de productoService (Sprint 1).
 * El cliente de Supabase se reemplaza por un mock encadenable, asi que
 * estas pruebas no realizan ninguna llamada de red.
 */

// Mock encadenable del cliente de Supabase.
jest.mock('../src/config/supabaseClient', () => {
  const chain = {
    __result: { data: null, error: null },
    select: jest.fn(() => chain),
    insert: jest.fn(() => chain),
    update: jest.fn(() => chain),
    eq: jest.fn(() => chain),
    order: jest.fn(() => chain),
    single: jest.fn(() => Promise.resolve(chain.__result)),
    // Hace que la cadena sea "await-able" (thenable).
    then: (resolve, reject) => Promise.resolve(chain.__result).then(resolve, reject),
  };
  const supabase = { from: jest.fn(() => chain) };
  return { supabase, crearCliente: jest.fn(), __chain: chain };
});

const { supabase, __chain } = require('../src/config/supabaseClient');
const productoService = require('../src/services/productoService');

beforeEach(() => {
  jest.clearAllMocks();
  __chain.__result = { data: null, error: null };
});

describe('validarProducto', () => {
  test('rechaza un producto sin nombre', () => {
    const errores = productoService.validarProducto({ precio: 5 });
    expect(errores.length).toBeGreaterThan(0);
  });

  test('rechaza un precio menor o igual a cero', () => {
    expect(productoService.validarProducto({ nombre: 'X', precio: 0 }).length).toBeGreaterThan(0);
    expect(productoService.validarProducto({ nombre: 'X', precio: -3 }).length).toBeGreaterThan(0);
  });

  test('acepta un producto valido', () => {
    expect(productoService.validarProducto({ nombre: 'Sandwich', precio: 5 })).toEqual([]);
  });
});

describe('crearProducto', () => {
  test('no permite crear un producto sin nombre', async () => {
    await expect(productoService.crearProducto({ precio: 5 })).rejects.toThrow();
    expect(supabase.from).not.toHaveBeenCalled();
  });

  test('no permite crear un producto con precio invalido', async () => {
    await expect(productoService.crearProducto({ nombre: 'Cafe', precio: 0 })).rejects.toThrow();
    expect(supabase.from).not.toHaveBeenCalled();
  });

  test('registra un producto valido como activo', async () => {
    __chain.__result = { data: { id: 'uuid-1', nombre: 'Sandwich', precio: 5, activo: true }, error: null };

    const producto = await productoService.crearProducto({ nombre: 'Sandwich', precio: 5, categoria: 'Sandwich' });

    expect(supabase.from).toHaveBeenCalledWith('productos');
    const insertado = __chain.insert.mock.calls[0][0][0];
    expect(insertado.nombre).toBe('Sandwich');
    expect(insertado.activo).toBe(true);
    expect(insertado.disponible).toBe(true);
    expect(producto.id).toBe('uuid-1');
  });

  test('registra categoria_id cuando se proporciona', async () => {
    __chain.__result = {
      data: { id: 'uuid-2', nombre: 'Cafe', precio: 4, activo: true, categoria_id: 'cat-1' },
      error: null
    };

    const producto = await productoService.crearProducto({
      nombre: 'Cafe',
      precio: 4,
      categoria: 'Bebida',
      categoria_id: 'cat-1'
    });

    const insertado = __chain.insert.mock.calls[0][0][0];
    expect(insertado.categoria_id).toBe('cat-1');
    expect(producto.categoriaId).toBe('cat-1');
    expect(producto.categoria_id).toBe('cat-1');
  });
});

describe('listados', () => {
  test('listarProductosDisponibles filtra por activo y disponible', async () => {
    __chain.__result = { data: [{ id: '1', disponible: true, activo: true }], error: null };

    const data = await productoService.listarProductosDisponibles();

    expect(__chain.eq).toHaveBeenCalledWith('activo', true);
    expect(__chain.eq).toHaveBeenCalledWith('disponible', true);
    expect(data).toHaveLength(1);
  });

  test('listarProductos solo trae productos activos', async () => {
    __chain.__result = { data: [], error: null };
    await productoService.listarProductos();
    expect(__chain.eq).toHaveBeenCalledWith('activo', true);
  });
});

describe('baja logica y disponibilidad', () => {
  test('desactivarProducto no elimina, solo marca activo = false', async () => {
    __chain.__result = { data: { id: '1', activo: false }, error: null };

    await productoService.desactivarProducto('1');

    expect(__chain.update).toHaveBeenCalledWith({ activo: false });
    // No debe existir una operacion de borrado.
    expect(__chain.select).toHaveBeenCalled();
  });

  test('cambiarDisponibilidadProducto guarda el motivo cuando se agota', async () => {
    __chain.__result = { data: { id: '1', disponible: false }, error: null };

    await productoService.cambiarDisponibilidadProducto('1', false, 'Sin ingredientes');

    expect(__chain.update).toHaveBeenCalledWith({
      disponible: false,
      motivo_no_disponible: 'Sin ingredientes',
    });
  });
});
