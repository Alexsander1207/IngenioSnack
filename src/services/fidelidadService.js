/**
 * fidelidadService
 * Programa de fidelidad: acumula puntos por cada pedido entregado y permite
 * canjearlos. Regla MVP: 1 punto por cada S/ 1 gastado (redondeado hacia abajo).
 */
const { supabase } = require('../config/supabaseClient');

/** Cantidad de soles que equivale a 1 punto de fidelidad. */
const SOLES_POR_PUNTO = 1;
const SANDWICHES_PARA_CAFE = 10;

/**
 * Busca un estudiante por su id.
 * @param {string} estudianteId
 * @returns {Promise<Object>}
 */
async function obtenerEstudiante(estudianteId) {
  const { data, error } = await supabase
    .from('estudiantes')
    .select('*')
    .eq('id', estudianteId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  if (!data) {
    throw new Error(`Estudiante no encontrado: ${estudianteId}`);
  }

  // Garantizar que las variables de la HU-07 existan en el objeto de la BD
  if (data.sandwiches === undefined) data.sandwiches = 0;
  if (data.cafes_gratis === undefined) data.cafes_gratis = 0;
  
  return data;
}

/**
 * Calcula los puntos que genera un total de compra.
 * @param {number} total Total del pedido en soles.
 * @returns {number} Puntos ganados.
 */
function calcularPuntos(total) {
  if (!total || total <= 0) return 0;
  return Math.floor(total / SOLES_POR_PUNTO);
}

/**
 * Acredita puntos a un estudiante por el total de un pedido.
 * @param {string} estudianteId
 * @param {number} total
 * @returns {Promise<number>} Puntos totales del estudiante tras la acreditacion.
 */
async function acreditarPuntos(estudianteId, total) {
  const estudiante = await obtenerEstudiante(estudianteId);
  const nuevosPuntos = (estudiante.puntos || 0) + calcularPuntos(total);

  const { error } = await supabase
    .from('estudiantes')
    .update({ puntos: nuevosPuntos })
    .eq('id', estudianteId);

  if (error) throw new Error(error.message);
  return nuevosPuntos;
}

/**
 * Canjea puntos de un estudiante.
 * @param {string} estudianteId
 * @param {number} puntos Puntos a canjear.
 * @returns {Promise<number>} Puntos restantes.
 */
async function canjearPuntos(estudianteId, puntos) {
  if (puntos <= 0) {
    throw new Error('Los puntos a canjear deben ser mayores a 0.');
  }

  const estudiante = await obtenerEstudiante(estudianteId);
  const puntosActuales = estudiante.puntos || 0;

  if (puntosActuales < puntos) {
    throw new Error('Puntos insuficientes para el canje.');
  }

  const puntosRestantes = puntosActuales - puntos;

  const { error } = await supabase
    .from('estudiantes')
    .update({ puntos: puntosRestantes })
    .eq('id', estudianteId);

  if (error) throw new Error(error.message);
  return puntosRestantes;
}

/**
 * HU-07: Tarjeta de fidelidad digital (Sándwiches).
 * Registra sándwiches comprados. Cada 10 genera un café americano gratis.
 * @param {string} estudianteId
 * @param {number} [cantidad=1]
 */
async function registrarSandwich(estudianteId, cantidad = 1) {
  if (cantidad <= 0) return obtenerBeneficios(estudianteId);

  const estudiante = await obtenerEstudiante(estudianteId);
  let totalSandwiches = (estudiante.sandwiches || 0) + cantidad;
  let cafesGratis = estudiante.cafes_gratis || 0;

  const cafesNuevos = Math.floor(totalSandwiches / SANDWICHES_PARA_CAFE);
  if (cafesNuevos > 0) {
    cafesGratis += cafesNuevos;
    totalSandwiches = totalSandwiches % SANDWICHES_PARA_CAFE;
  }

  const { error } = await supabase
    .from('estudiantes')
    .update({ sandwiches: totalSandwiches, cafes_gratis: cafesGratis })
    .eq('id', estudianteId);

  if (error) throw new Error(error.message);
  return { sandwiches: totalSandwiches, cafesGratis };
}

/**
 * Retorna el resumen de beneficios del estudiante (Puntos, sándwiches y cafés).
 * @param {string} estudianteId
 */
async function obtenerBeneficios(estudianteId) {
  const e = await obtenerEstudiante(estudianteId);
  return {
    puntos: e.puntos || 0,
    sandwiches: e.sandwiches || 0,
    cafesGratis: e.cafes_gratis || 0,
    sandwichesParaSiguienteCafe: SANDWICHES_PARA_CAFE - (e.sandwiches || 0),
  };
}

/**
 * Canjea un cafe gratis del estudiante si dispone de ellos en su cuenta.
 * @param {string} estudianteId
 */
async function canjearCafeGratis(estudianteId) {
  const estudiante = await obtenerEstudiante(estudianteId);
  const cafesGratis = estudiante.cafes_gratis || 0;
  
  if (cafesGratis <= 0) {
    throw new Error('No tienes cafes gratis disponibles.');
  }
  
  const nuevosCafes = cafesGratis - 1;

  const { error } = await supabase
    .from('estudiantes')
    .update({ cafes_gratis: nuevosCafes })
    .eq('id', estudianteId);

  if (error) throw new Error(error.message);
  return { cafesGratis: nuevosCafes };
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