/**
 * fidelidadService
 * Programa de fidelidad: acumula puntos por cada pedido entregado y permite
 * canjearlos. Regla MVP: 1 punto por cada S/ 1 gastado (redondeado hacia abajo).
 */
const { db } = require('../data/memoria');

/** Cantidad de soles que equivale a 1 punto de fidelidad. */
const SOLES_POR_PUNTO = 1;

/**
 * Busca un estudiante por su id.
 * @param {string} estudianteId
 * @returns {import('../models/Estudiante')}
 */
function obtenerEstudiante(estudianteId) {
  const estudiante = db.estudiantes.find((e) => e.id === estudianteId);
  if (!estudiante) {
    throw new Error(`Estudiante no encontrado: ${estudianteId}`);
  }
  return estudiante;
}

/**
 * Calcula los puntos que genera un total de compra.
 * @param {number} total Total del pedido en soles.
 * @returns {number} Puntos ganados.
 */
function calcularPuntos(total) {
  return Math.floor(total / SOLES_POR_PUNTO);
}

/**
 * Acredita puntos a un estudiante por el total de un pedido.
 * @param {string} estudianteId
 * @param {number} total
 * @returns {number} Puntos totales del estudiante tras la acreditacion.
 */
function acreditarPuntos(estudianteId, total) {
  const estudiante = obtenerEstudiante(estudianteId);
  estudiante.puntos += calcularPuntos(total);
  return estudiante.puntos;
}

/**
 * Canjea puntos de un estudiante.
 * @param {string} estudianteId
 * @param {number} puntos Puntos a canjear.
 * @returns {number} Puntos restantes.
 */
function canjearPuntos(estudianteId, puntos) {
  const estudiante = obtenerEstudiante(estudianteId);
  if (puntos <= 0) {
    throw new Error('Los puntos a canjear deben ser mayores a 0.');
  }
  if (puntos > estudiante.puntos) {
    throw new Error('Puntos insuficientes para el canje.');
  }
  estudiante.puntos -= puntos;
  return estudiante.puntos;
}

const SANDWICHES_PARA_CAFE = 10;

/**
 * Registra sandwiches comprados. Cada 10 genera un cafe americano gratis (HU-07).
 * @param {string} estudianteId
 * @param {number} [cantidad=1]
 */
function registrarSandwich(estudianteId, cantidad = 1) {
  const estudiante = obtenerEstudiante(estudianteId);
  estudiante.sandwiches += cantidad;
  const cafesNuevos = Math.floor(estudiante.sandwiches / SANDWICHES_PARA_CAFE);
  if (cafesNuevos > 0) {
    estudiante.cafesGratis += cafesNuevos;
    estudiante.sandwiches = estudiante.sandwiches % SANDWICHES_PARA_CAFE;
  }
  return { sandwiches: estudiante.sandwiches, cafesGratis: estudiante.cafesGratis };
}

/**
 * Retorna el resumen de beneficios del estudiante.
 * @param {string} estudianteId
 */
function obtenerBeneficios(estudianteId) {
  const e = obtenerEstudiante(estudianteId);
  return {
    puntos: e.puntos,
    sandwiches: e.sandwiches,
    cafesGratis: e.cafesGratis,
    sandwichesParaSiguienteCafe: SANDWICHES_PARA_CAFE - e.sandwiches,
  };
}

/**
 * Canjea un cafe gratis del estudiante.
 * @param {string} estudianteId
 */
function canjearCafeGratis(estudianteId) {
  const estudiante = obtenerEstudiante(estudianteId);
  if (estudiante.cafesGratis <= 0) throw new Error('No tienes cafes gratis disponibles.');
  estudiante.cafesGratis -= 1;
  return { cafesGratis: estudiante.cafesGratis };
}

module.exports = {
  calcularPuntos,
  acreditarPuntos,
  canjearPuntos,
  registrarSandwich,
  obtenerBeneficios,
  canjearCafeGratis,
  SOLES_POR_PUNTO,
  SANDWICHES_PARA_CAFE,
};
