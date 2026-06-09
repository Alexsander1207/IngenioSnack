/**
 * app.js
 * Demostracion por consola del Dia 2 (HU-01: Consultar menu disponible).
 * Carga productos de ejemplo y muestra unicamente los que estan disponibles.
 *
 * Ejecutar con: npm start
 */
const {
  registrarProducto,
  listarProductosDisponibles,
} = require('./services/menuService');

registrarProducto({
  nombre: 'Sandwich de pollo',
  precio: 5,
  categoria: 'Sandwich',
  disponible: true,
});

registrarProducto({
  nombre: 'Cafe americano',
  precio: 3,
  categoria: 'Bebida',
  disponible: true,
});

registrarProducto({
  nombre: 'Empanada',
  precio: 4,
  categoria: 'Snack',
  disponible: false,
});

const productosDisponibles = listarProductosDisponibles();

console.log('Productos disponibles:');

if (productosDisponibles.length === 0) {
  console.log('No hay productos disponibles en este momento.');
} else {
  productosDisponibles.forEach((producto) => {
    console.log(`- ${producto.nombre} | S/ ${producto.precio.toFixed(2)} | ${producto.categoria}`);
  });
}
