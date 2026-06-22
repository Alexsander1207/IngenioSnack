/**
 * Almacenamiento en memoria (MVP)
 * Simula la base de datos del sistema mientras se desarrolla el MVP de 5 dias.
 * El Dia 2 (HU-01) trabaja sobre `memoria.productos`. Las colecciones
 * `pedidos` y `estudiantes` quedan listas para los Dias 3 y 4.
 */

const memoria = {
  productos: [],
  estudiantes: [],
  pedidos: [],
};

/**
 * Reinicia todas las colecciones. Util para aislar pruebas (beforeEach).
 */
function reset() {
  memoria.productos = [];
  memoria.estudiantes = [];
  memoria.pedidos = [];
}

module.exports = memoria;
// Helpers de compatibilidad usados por las pruebas y servicios de otros dias.
module.exports.reset = reset;
module.exports.db = memoria;
