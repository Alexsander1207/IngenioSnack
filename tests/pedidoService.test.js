const menuService = require('../src/services/menuService');
const pedidoService = require('../src/services/pedidoService');
const { ESTADOS } = require('../src/models/Pedido');
const { reset } = require('../src/data/memoria');

describe('pedidoService', () => {
  beforeEach(() => {
    reset();
    menuService.agregarProducto({ id: 'P1', nombre: 'Empanada', precio: 3.5, categoria: 'comida' });
    menuService.agregarProducto({ id: 'P2', nombre: 'Jugo', precio: 4.0, categoria: 'bebida' });
  });

  test('crea un pedido y calcula el total', () => {
    const pedido = pedidoService.crearPedido('E1', [
      { productoId: 'P1', cantidad: 2 },
      { productoId: 'P2', cantidad: 1 },
    ]);
    expect(pedido.total).toBe(11);
    expect(pedido.estado).toBe(ESTADOS.PENDIENTE);
  });

  test('rechaza un pedido sin items', () => {
    expect(() => pedidoService.crearPedido('E1', [])).toThrow();
  });

  test('rechaza un producto inexistente', () => {
    expect(() => pedidoService.crearPedido('E1', [{ productoId: 'XXX', cantidad: 1 }])).toThrow();
  });

  test('cambia el estado del pedido', () => {
    const pedido = pedidoService.crearPedido('E1', [{ productoId: 'P1', cantidad: 1 }]);
    pedidoService.cambiarEstado(pedido.id, ESTADOS.LISTO);
    expect(pedidoService.obtenerPedido(pedido.id).estado).toBe(ESTADOS.LISTO);
  });

  test('rechaza un estado invalido', () => {
    const pedido = pedidoService.crearPedido('E1', [{ productoId: 'P1', cantidad: 1 }]);
    expect(() => pedidoService.cambiarEstado(pedido.id, 'VOLANDO')).toThrow();
  });
});
