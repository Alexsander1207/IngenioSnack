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

module.exports = {
  calcularPuntos,
  acreditarPuntos,
  canjearPuntos,
  SOLES_POR_PUNTO,
};
