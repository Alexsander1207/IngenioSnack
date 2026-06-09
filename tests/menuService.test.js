const memoria = require('../src/data/memoria');

const {
  registrarProducto,
  listarProductos,
  listarProductosDisponibles,
  cambiarDisponibilidadProducto,
} = require('../src/services/menuService');

beforeEach(() => {
  memoria.productos = [];
});

test('debe registrar un producto en el menu', () => {
  const producto = registrarProducto({
    nombre: 'Sandwich de pollo',
    precio: 5,
    categoria: 'Sandwich',
    disponible: true,
  });

  expect(producto.nombre).toBe('Sandwich de pollo');
  expect(producto.precio).toBe(5);
  expect(producto.categoria).toBe('Sandwich');
  expect(producto.disponible).toBe(true);
});

test('debe listar todos los productos registrados', () => {
  registrarProducto({ nombre: 'Sandwich de pollo', precio: 5, categoria: 'Sandwich', disponible: true });
  registrarProducto({ nombre: 'Empanada', precio: 4, categoria: 'Snack', disponible: false });

  expect(listarProductos()).toHaveLength(2);
});

// HU-01: prueba central — filtra arreglo recibido como argumento
test('debe listar solo los productos disponibles del menu', () => {
  const productos = [
    { nombre: 'Sandwich de pollo', precio: 5, categoria: 'Sandwich', disponible: true },
    { nombre: 'Empanada', precio: 4, categoria: 'Snack', disponible: false },
  ];

  const resultado = listarProductosDisponibles(productos);

  expect(resultado).toHaveLength(1);
  expect(resultado[0].nombre).toBe('Sandwich de pollo');
});

test('debe excluir productos no disponibles del menu visible', () => {
  registrarProducto({ nombre: 'Cafe americano', precio: 3, categoria: 'Bebida', disponible: true });
  registrarProducto({ nombre: 'Pan con pollo', precio: 6, categoria: 'Sandwich', disponible: false });

  const disponibles = listarProductosDisponibles();

  expect(disponibles).toHaveLength(1);
  expect(disponibles[0].nombre).toBe('Cafe americano');
});

test('debe cambiar la disponibilidad de un producto sin eliminarlo', () => {
  const producto = registrarProducto({ nombre: 'Triple', precio: 5, categoria: 'Sandwich', disponible: true });

  const actualizado = cambiarDisponibilidadProducto(producto.id, false);

  expect(actualizado.disponible).toBe(false);
  expect(listarProductos()).toHaveLength(1);
});
