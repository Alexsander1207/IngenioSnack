/**
 * Almacenamiento en memoria (MVP)
 * Simula la base de datos del sistema mientras se desarrolla el MVP de 5 dias.
 * Los servicios leen y escriben sobre estas colecciones.
 */

const db = {
  productos: [],
  estudiantes: [],
  pedidos: [],
};

/**
 * Reinicia todas las colecciones. Util para aislar pruebas (beforeEach).
 */
function reset() {
  db.productos = [];
  db.estudiantes = [];
  db.pedidos = [];
}

module.exports = { db, reset };
