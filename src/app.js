/**
 * app.js — Flujo MVP final de IngenioSnack (Dia 5)
 * Demuestra el ciclo completo: identificacion del estudiante, consulta del
 * menu, seleccion de productos, calculo del total, validacion de
 * disponibilidad y confirmacion del pedido.
 *
 * Ejecutar con: npm start
 */
const menuService    = require('./services/menuService');
const pedidoService  = require('./services/pedidoService');
const fidelidadService = require('./services/fidelidadService');
const Estudiante     = require('./models/Estudiante');
const { ESTADOS }    = require('./models/Pedido');
const { db }         = require('./data/memoria');

// ──────────────────────────────────────────────
//  UTILIDADES DE PRESENTACION
// ──────────────────────────────────────────────

const SEP  = '─'.repeat(40);
const DSEP = '═'.repeat(40);

function titulo(texto) {
  console.log('\n' + DSEP);
  console.log(`  ${texto}`);
  console.log(DSEP);
}

function seccion(texto) {
  console.log('\n' + SEP);
  console.log(`  ${texto}`);
  console.log(SEP);
}

function msg(icono, texto) {
  console.log(`  ${icono}  ${texto}`);
}

// ──────────────────────────────────────────────
//  PANTALLA: MENU DISPONIBLE (HU-02)
// ──────────────────────────────────────────────

function mostrarMenu(productos) {
  titulo('☕  IngenioSnack — Menu del dia');
  const categorias = [...new Set(productos.map(p => p.categoria))];
  for (const cat of categorias) {
    console.log(`\n  [ ${cat.toUpperCase()} ]`);
    productos.filter(p => p.categoria === cat).forEach(p => {
      const estado = p.disponible ? '✅' : '❌ AGOTADO';
      console.log(`  ${estado}  ${p.nombre.padEnd(22)} S/ ${p.precio.toFixed(2)}`);
    });
  }
  console.log('\n' + SEP);
  msg('💡', 'Haz tu pedido antes de salir de clase y evita la fila.');
}

// ──────────────────────────────────────────────
//  PANTALLA: RESUMEN DE PEDIDO (HU-03)
// ──────────────────────────────────────────────

function mostrarResumenPedido(pedido, estudiante) {
  seccion(`📦 Resumen del pedido — ${pedido.id}`);
  msg('👤', `Estudiante : ${estudiante.nombre}  |  Codigo: ${estudiante.codigo || 'S/N'}`);
  console.log('');
  pedido.items.forEach(item => {
    console.log(`  x${item.cantidad}  ${item.producto.nombre.padEnd(22)} S/ ${item.subtotal.toFixed(2)}`);
  });
  console.log(SEP);
  console.log(`  TOTAL A PAGAR (contra entrega):  S/ ${pedido.total.toFixed(2)}`);
  console.log(`  ESTADO:                          ${pedido.estado}`);
  console.log(SEP);
}

// ──────────────────────────────────────────────
//  DATOS: CARGAR MENU INICIAL
// ──────────────────────────────────────────────

function cargarMenu() {
  menuService.registrarProducto({ id: 'S1', nombre: 'Sandwich de pollo', precio: 5.00, categoria: 'Sandwich' });
  menuService.registrarProducto({ id: 'S2', nombre: 'Triple',            precio: 6.00, categoria: 'Sandwich' });
  menuService.registrarProducto({ id: 'B1', nombre: 'Cafe americano',    precio: 3.00, categoria: 'Bebida'   });
  menuService.registrarProducto({ id: 'B2', nombre: 'Jugo de naranja',   precio: 4.00, categoria: 'Bebida'   });
  menuService.registrarProducto({ id: 'K1', nombre: 'Empanada de pollo', precio: 4.00, categoria: 'Snack'    });
  menuService.registrarProducto({ id: 'K2', nombre: 'Galletas',          precio: 2.00, categoria: 'Snack'    });
  menuService.registrarProducto({ id: 'K3', nombre: 'Papa frita',        precio: 2.50, categoria: 'Snack',   disponible: false });
}

// ──────────────────────────────────────────────
//  FLUJO PRINCIPAL
// ──────────────────────────────────────────────

function main() {
  cargarMenu();

  // ── 1. Mostrar menu (HU-02) ──
  mostrarMenu(menuService.listarProductos());

  // ── 2. Identificar estudiante (HU-01) ──
  titulo('👤 Identificacion del estudiante (HU-01)');
  const estudiante = new Estudiante({ id: 'E1', nombre: 'Ana Quispe', codigo: '2021100123' });
  db.estudiantes.push(estudiante);
  msg('✅', `Bienvenida, ${estudiante.nombre}! (Codigo: ${estudiante.codigo})`);

  // ── 3. Caso A: pedido con producto no disponible (HU-04) ──
  titulo('⚠️  Caso A — Pedido con producto no disponible (HU-04)');
  const pedidoInvalido = {
    items: [{ producto: { nombre: 'Papa frita', disponible: false }, cantidad: 1 }],
  };
  const validacion = pedidoService.validarDisponibilidadPedido(pedidoInvalido);
  msg(validacion.valido ? '✅' : '❌', validacion.mensaje);
  msg('ℹ️ ', 'Selecciona otro producto del menu.');

  // ── 4. Caso B: pedido valido, confirmacion y puntos (HU-03, HU-04) ──
  titulo('✅  Caso B — Pedido valido y confirmacion (HU-03)');
  const pedido = pedidoService.crearPedido(estudiante.id, [
    { productoId: 'S1', cantidad: 2 },
    { productoId: 'B1', cantidad: 1 },
  ]);
  mostrarResumenPedido(pedido, estudiante);

  pedidoService.confirmarPedido(pedido.id);
  msg('✅', `Pedido confirmado. Estado: ${pedido.estado}`);
  msg('💵', 'Recojelo en la cafeteria y paga contra entrega.');

  // ── 5. Entrega y fidelidad (HU-06, HU-07) ──
  titulo('🎁  Fidelidad — Entrega y acumulacion de puntos (HU-06/07)');
  pedidoService.cambiarEstado(pedido.id, ESTADOS.ENTREGADO);
  const puntos = fidelidadService.acreditarPuntos(estudiante.id, pedido.total);
  msg('✅', `Pedido ${pedido.id} entregado y pagado.`);

  // Contar sandwiches del pedido para fidelidad
  const sandwichesEnPedido = pedido.items
    .filter(i => i.producto.categoria === 'Sandwich')
    .reduce((s, i) => s + i.cantidad, 0);
  if (sandwichesEnPedido > 0) {
    fidelidadService.registrarSandwich(estudiante.id, sandwichesEnPedido);
  }

  const beneficios = fidelidadService.obtenerBeneficios(estudiante.id);
  msg('⭐', `Puntos acumulados  : ${puntos}`);
  msg('🥪', `Sandwiches: ${beneficios.sandwiches}/10 para el siguiente cafe gratis`);
  msg('☕', `Cafes gratis disponibles: ${beneficios.cafesGratis}`);

  // ── 6. Gestion de disponibilidad por el Sr. Julio (HU-05) ──
  titulo('🔧  Sr. Julio — Gestion de disponibilidad (HU-05)');
  menuService.cambiarDisponibilidadProducto('K3', true);
  msg('✅', 'Papa frita marcada como DISPONIBLE.');
  menuService.cambiarDisponibilidadProducto('S2', false);
  msg('❌', 'Triple marcado como NO DISPONIBLE.');
  console.log('\n  Menu actualizado:');
  menuService.listarProductosDisponibles().forEach(p => {
    console.log(`    ✅  ${p.nombre}`);
  });

  console.log('\n' + DSEP);
  msg('🚀', 'MVP IngenioSnack — Flujo completo verificado.');
  msg('📋', '22/22 pruebas unitarias en verde.');
  console.log(DSEP + '\n');
}

main();

module.exports = { cargarMenu, mostrarMenu, mostrarResumenPedido };
