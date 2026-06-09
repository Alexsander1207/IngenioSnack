const menuService = require('../src/services/menuService');
const { reset } = require('../src/data/memoria');

describe('menuService', () => {
  beforeEach(() => reset());

  test('agrega un producto al menu', () => {
    const p = menuService.agregarProducto({ id: 'P1', nombre: 'Empanada', precio: 3.5, categoria: 'comida' });
    expect(p.id).toBe('P1');
    expect(menuService.listarProductos()).toHaveLength(1);
  });

  test('lista solo los productos disponibles', () => {
    menuService.agregarProducto({ id: 'P1', nombre: 'Empanada', precio: 3.5, categoria: 'comida' });
    menuService.agregarProducto({ id: 'P2', nombre: 'Cafe agotado', precio: 4, categoria: 'bebida', disponible: false });

    const disponibles = menuService.listarDisponibles();
    expect(disponibles).toHaveLength(1);
    expect(disponibles[0].id).toBe('P1');
  });

  test('obtiene un producto por id', () => {
    menuService.agregarProducto({ id: 'P1', nombre: 'Empanada', precio: 3.5, categoria: 'comida' });
    expect(menuService.obtenerProducto('P1').nombre).toBe('Empanada');
    expect(menuService.obtenerProducto('NO-EXISTE')).toBeUndefined();
  });
});
