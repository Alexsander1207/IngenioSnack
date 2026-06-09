/**
 * app.js
 * Punto de entrada del MVP. Muestra la pantalla principal de IngenioSnack,
 * valida disponibilidad y demuestra confirmacion de pedido (HU-01, HU-03).
 *
 * Ejecutar con: npm start
 */
const {
  registrarProducto,
  listarProductos,
  listarProductosDisponibles,
} = require('./services/menuService');
const {
  crearPedido,
  confirmarPedido,
  validarDisponibilidadPedido,
} = require('./services/pedidoService');

// ─────────────────────────────────────────────
//  PANTALLA PRINCIPAL — Diseño movil en consola
// ─────────────────────────────────────────────

function mostrarPantallaPrincipal(productos) {
  const linea = '─'.repeat(36);

  console.log('\n' + '═'.repeat(36));
  console.log('       ☕  IngenioSnack  ☕');
  console.log('   Cafeteria - Laboratorios UNCP');
  console.log('═'.repeat(36));
  console.log('  📋 MENU DISPONIBLE');
  console.log(linea);

  const categorias = [...new Set(productos.map((p) => p.categoria))];

  for (const categoria of categorias) {
    console.log(`\n  [${categoria.toUpperCase()}]`);
    const items = productos.filter((p) => p.categoria === categoria);
    for (const p of items) {
      const estado = p.disponible ? '✅' : '❌ AGOTADO';
      const precio = `S/ ${p.precio.toFixed(2)}`;
      console.log(`  ${estado}  ${p.nombre.padEnd(18)} ${precio}`);
    }
  }

  console.log('\n' + linea);
  console.log('  💡 Haz tu pedido antes de salir');
  console.log('     de clase y evita las filas.');
  console.log('═'.repeat(36) + '\n');
}

function mostrarResumenPedido(pedido) {
  const linea = '─'.repeat(36);
  console.log('\n' + linea);
  console.log(`  📦 RESUMEN DE PEDIDO — ${pedido.id}`);
  console.log(linea);
  pedido.items.forEach((item) => {
    const subtotal = `S/ ${item.subtotal.toFixed(2)}`;
    console.log(`  x${item.cantidad}  ${item.producto.nombre.padEnd(18)} ${subtotal}`);
  });
  console.log(linea);
  console.log(`  TOTAL:                    S/ ${pedido.total.toFixed(2)}`);
  console.log(`  ESTADO:                   ${pedido.estado}`);
  console.log(linea + '\n');
}

function mostrarMensaje(tipo, texto) {
  const iconos = { ok: '✅', error: '❌', info: 'ℹ️ ' };
  console.log(`  ${iconos[tipo] || ''} ${texto}`);
}

// ─────────────────────────────────────────────
//  DEMO DEL FLUJO COMPLETO
// ─────────────────────────────────────────────

registrarProducto({ id: 'P1', nombre: 'Sandwich de pollo', precio: 5,   categoria: 'Sandwich', disponible: true  });
registrarProducto({ id: 'P2', nombre: 'Cafe americano',    precio: 3,   categoria: 'Bebida',   disponible: true  });
registrarProducto({ id: 'P3', nombre: 'Empanada',          precio: 4,   categoria: 'Snack',    disponible: false });
registrarProducto({ id: 'P4', nombre: 'Jugo de naranja',   precio: 4,   categoria: 'Bebida',   disponible: true  });

mostrarPantallaPrincipal(listarProductos());

// Intento de pedido con producto no disponible
console.log('  --- Caso 1: pedido con producto no disponible ---');
const pedidoInvalido = {
  items: [{ producto: { nombre: 'Empanada', precio: 4, disponible: false }, cantidad: 1 }],
};
const validacion = validarDisponibilidadPedido(pedidoInvalido);
mostrarMensaje(validacion.valido ? 'ok' : 'error', validacion.mensaje);
mostrarMensaje('info', 'Seleccione otra opcion del menu.');

console.log('\n  --- Caso 2: pedido valido y confirmacion ---');
try {
  const pedido = crearPedido('E1', [
    { productoId: 'P1', cantidad: 1 },
    { productoId: 'P4', cantidad: 2 },
  ]);
  mostrarResumenPedido(pedido);

  confirmarPedido(pedido.id);
  mostrarMensaje('ok', 'Pedido confirmado correctamente.');
  mostrarMensaje('info', `Nuevo estado: ${pedido.estado}`);
} catch (e) {
  mostrarMensaje('error', `No se puede confirmar el pedido: ${e.message}`);
}

module.exports = { mostrarPantallaPrincipal, mostrarResumenPedido, mostrarMensaje };
