/**
 * app.js
 * Punto de entrada del MVP. Demuestra el flujo basico de IngenioSnack:
 * cargar menu -> registrar estudiante -> crear pedido -> entregar -> fidelidad.
 *
 * Ejecutar con: npm start
 */
const menuService = require('./services/menuService');
const pedidoService = require('./services/pedidoService');
const fidelidadService = require('./services/fidelidadService');
const Estudiante = require('./models/Estudiante');
const { ESTADOS } = require('./models/Pedido');
const { db } = require('./data/memoria');

function cargarMenuInicial() {
  menuService.agregarProducto({ id: 'P1', nombre: 'Empanada de pollo', precio: 3.5, categoria: 'comida' });
  menuService.agregarProducto({ id: 'P2', nombre: 'Jugo de naranja', precio: 4.0, categoria: 'bebida' });
  menuService.agregarProducto({ id: 'P3', nombre: 'Galletas', precio: 2.0, categoria: 'snack' });
}

function main() {
  cargarMenuInicial();

  const estudiante = new Estudiante({ id: 'E1', nombre: 'Ana Quispe', codigo: '2021100123' });
  db.estudiantes.push(estudiante);

  const pedido = pedidoService.crearPedido(estudiante.id, [
    { productoId: 'P1', cantidad: 2 },
    { productoId: 'P2', cantidad: 1 },
  ]);

  console.log(`Pedido ${pedido.id} creado para ${estudiante.nombre}`);
  console.log(`Total: S/ ${pedido.total.toFixed(2)}`);

  pedidoService.cambiarEstado(pedido.id, ESTADOS.LISTO);
  pedidoService.cambiarEstado(pedido.id, ESTADOS.ENTREGADO);

  const puntos = fidelidadService.acreditarPuntos(estudiante.id, pedido.total);
  console.log(`Puntos acumulados de ${estudiante.nombre}: ${puntos}`);
}

if (require.main === module) {
  main();
}

module.exports = { main, cargarMenuInicial };
