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

  // --- HU-03: validacion de disponibilidad (Dia 4) ---

  test('debe bloquear el pedido si un producto no esta disponible', () => {
    const pedido = {
      estudiante: { nombre: 'Alex', codigo: '20240001' },
      items: [
        {
          producto: { nombre: 'Sandwich de pollo', precio: 5, disponible: false },
          cantidad: 1,
        },
      ],
    };

    const resultado = pedidoService.validarDisponibilidadPedido(pedido);

    expect(resultado.valido).toBe(false);
    expect(resultado.mensaje).toBe('El pedido contiene productos no disponibles');
  });

  test('debe permitir el pedido si todos los productos estan disponibles', () => {
    const pedido = {
      estudiante: { nombre: 'Ana', codigo: '20240002' },
      items: [
        {
          producto: { nombre: 'Sandwich de pollo', precio: 5, disponible: true },
          cantidad: 1,
        },
        {
          producto: { nombre: 'Jugo de naranja', precio: 4, disponible: true },
          cantidad: 2,
        },
      ],
    };

    const resultado = pedidoService.validarDisponibilidadPedido(pedido);

    expect(resultado.valido).toBe(true);
  });

  test('confirma un pedido con productos disponibles y cambia estado a CONFIRMADO', () => {
    const pedido = pedidoService.crearPedido('E1', [{ productoId: 'P1', cantidad: 1 }]);
    const confirmado = pedidoService.confirmarPedido(pedido.id);
    expect(confirmado.estado).toBe(ESTADOS.CONFIRMADO);
  });

  test('bloquea la confirmacion si un producto se volvio no disponible', () => {
    const pedido = pedidoService.crearPedido('E1', [{ productoId: 'P1', cantidad: 1 }]);
    menuService.cambiarDisponibilidadProducto('P1', false);
    expect(() => pedidoService.confirmarPedido(pedido.id)).toThrow(
      'El pedido contiene productos no disponibles'
    );
  });

  // --- Refactor: calcularTotalPedido (Dia 4) ---

  test('calcularTotalPedido suma correctamente los items', () => {
    const items = [
      { precioUnitario: 5, cantidad: 2 },
      { precioUnitario: 3, cantidad: 1 },
    ];
    expect(pedidoService.calcularTotalPedido(items)).toBe(13);
  });

  // --- HU-02: funciones de pedido del Dia 3 ---

  test('calcularSubtotal calcula precio unitario por cantidad', () => {
    expect(pedidoService.calcularSubtotal({ precioUnitario: 5, cantidad: 2 })).toBe(10);
  });

  test('agregarItemPedido agrega una linea a un pedido existente', () => {
    const pedido = pedidoService.crearPedido('E1', [{ productoId: 'P1', cantidad: 1 }]);
    pedidoService.agregarItemPedido(pedido, { nombre: 'Jugo', precio: 4 }, 2);
    expect(pedido.items).toHaveLength(2);
    expect(pedido.total).toBe(3.5 + 4 * 2);
  });
});
