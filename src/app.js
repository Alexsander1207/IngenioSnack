/**
 * app.js
 * Punto de entrada del MVP. Muestra la pantalla principal de IngenioSnack
 * con el menu disponible (HU-01).
 *
 * Ejecutar con: npm start
 */
const {
  registrarProducto,
  listarProductos,
  listarProductosDisponibles,
} = require('./services/menuService');

// ─────────────────────────────────────────────
//  PANTALLA PRINCIPAL — Diseño movil en consola
//  Vista pensada para consulta desde celular
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

registrarProducto({ nombre: 'Sandwich de pollo', precio: 5, categoria: 'Sandwich', disponible: true });
registrarProducto({ nombre: 'Cafe americano',    precio: 3, categoria: 'Bebida',   disponible: true });
registrarProducto({ nombre: 'Empanada',          precio: 4, categoria: 'Snack',    disponible: false });
registrarProducto({ nombre: 'Jugo de naranja',   precio: 4, categoria: 'Bebida',   disponible: true });
registrarProducto({ nombre: 'Galletas',          precio: 2, categoria: 'Snack',    disponible: true });

mostrarPantallaPrincipal(listarProductos());

const disponibles = listarProductosDisponibles();
console.log(`Productos disponibles: ${disponibles.length}`);
disponibles.forEach((p) => {
  console.log(`  - ${p.nombre} | S/ ${p.precio.toFixed(2)} | ${p.categoria}`);
});

module.exports = { mostrarPantallaPrincipal };
