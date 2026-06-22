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

/**
 * HU-XX: Obtener el ranking de estudiantes con mayor puntaje.
 * @param {number} limite Cantidad de estudiantes a retornar en el top.
 */
async function obtenerRankingClientes(limite = 10) {
  const { data, error } = await supabase
    .from('estudiantes')
    .select('id, nombre, puntos')
    .order('puntos', { ascending: false }) // Ordena de mayor a menor puntos
    .limit(limite);

  if (error) {
    throw new Error(`Error al obtener el ranking: ${error.message}`);
  }
  return data;
}

/**
 * HU-XX: Crear una nueva regla de fidelidad dinámica (Vendedor).
 */
async function crearReglaFidelidad({ nombre, productoCriterioId, cantidadCriterio, productoPremioId }) {
  const { data, error } = await supabase
    .from('reglas_fidelidad')
    .insert([
      { 
        nombre, 
        producto_criterio_id: productoCriterioId, 
        cantidad_criterio: cantidadCriterio, 
        producto_premio_id: productoPremioId,
        activo: true 
      }
    ])
    .select()
    .single();

  if (error) {
    throw new Error(`Error al crear la regla de fidelidad: ${error.message}`);
  }
  return data;
}

/**
 * HU-XX: Listar todas las reglas de fidelidad activas en el sistema.
 */
async function listarReglasFidelidad() {
  const { data, error } = await supabase
    .from('reglas_fidelidad')
    .select('*')
    .eq('activo', true);

  if (error) {
    throw new Error(`Error al listar las reglas: ${error.message}`);
  }
  return data;
}
/**
 * HU-XX: Actualiza el progreso de compra de un estudiante de manera dinámica
 * basándose en las reglas de fidelidad activas.
 */
async function actualizarProgresoCompra(estudianteId, productoId, cantidad) {
  if (cantidad <= 0) return { message: 'Cantidad inválida' };

  // 1. Buscar si existe una regla activa para este producto específico
  const { data: regla, error: errorRegla } = await supabase
    .from('reglas_fidelidad')
    .select('*')
    .eq('producto_criterio_id', productoId)
    .eq('activo', true)
    .maybeSingle();

  if (errorRegla) throw new Error(`Error buscando regla: errorRegla.message`);
  
  // Si no hay ninguna regla activa para este producto, no hay progreso que actualizar
  if (!regla) return { message: 'Sin reglas activas para este producto' };

  // 2. Obtener o inicializar el progreso del estudiante para este producto
  const { data: progreso, error: errorProgreso } = await supabase
    .from('progreso_fidelidad')
    .select('*')
    .eq('estudiante_id', estudianteId)
    .eq('producto_criterio_id', productoId)
    .maybeSingle();

  if (errorProgreso) throw new Error(`Error buscando progreso: ${errorProgreso.message}`);

  let cantidadAcumulada = progreso ? progreso.cantidad_acumulada : 0;
  let premiosDisponibles = progreso ? progreso.premios_disponibles : 0;

  // 3. Sumar la nueva cantidad comprada
  cantidadAcumulada += cantidad;

  // 4. Calcular de forma dinámica cuántos premios nuevos ganó
  const nuevosPremios = Math.floor(cantidadAcumulada / regla.cantidad_criterio);
  
  if (nuevosPremios > 0) {
    premiosDisponibles += nuevosPremios;
    // El residuo (%) se mantiene acumulado para la siguiente meta
    cantidadAcumulada = cantidadAcumulada % regla.cantidad_criterio;
  }

  // 5. Guardar o actualizar el registro en 'progreso_fidelidad'
  let resultado;
  if (progreso) {
    // Si ya tenía historial, actualizamos el registro existente
    const { data, error } = await supabase
      .from('progreso_fidelidad')
      .update({ cantidad_acumulada: cantidadAcumulada, premios_disponibles: premiosDisponibles })
      .eq('id', progreso.id)
      .select()
      .single();
      
    if (error) throw new Error(error.message);
    resultado = data;
  } else {
    // Si es su primera compra de este producto bajo esta regla, insertamos un registro nuevo
    const { data, error } = await supabase
      .from('progreso_fidelidad')
      .insert([
        {
          estudiante_id: estudianteId,
          producto_criterio_id: productoId,
          cantidad_acumulada: cantidadAcumulada,
          premios_disponibles: premiosDisponibles
        }
      ])
      .select()
      .single();

    if (error) throw new Error(error.message);
    resultado = data;
  }

  return {
    regla: regla.nombre,
    cantidadAcumulada,
    premiosDisponibles
  };
}

module.exports = {
  calcularPuntos,
  acreditarPuntos,
  canjearPuntos,
  registrarSandwich,
  obtenerBeneficios,
  canjearCafeGratis,
  obtenerRankingClientes,
  crearReglaFidelidad,
  listarReglasFidelidad,
  canjearCafeGratis,
  SOLES_POR_PUNTO,
  SANDWICHES_PARA_CAFE,
};