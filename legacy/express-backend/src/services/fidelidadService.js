/**
 * fidelidadService
 * Programa de fidelidad: acumula puntos por cada pedido entregado y permite
 * canjearlos. Regla MVP: 1 punto por cada S/ 1 gastado (redondeado hacia abajo).
 */
const { supabase } = require('../config/supabaseClient');

/** Cantidad de soles que equivale a 1 punto de fidelidad. */
const SOLES_POR_PUNTO = 1;

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
  return data;
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
 * @returns {Promise<number>} Puntos totales del estudiante tras la acreditacion.
 */
async function acreditarPuntos(estudianteId, total) {
  const estudiante = await obtenerEstudiante(estudianteId);
  const nuevosPuntos = estudiante.puntos + calcularPuntos(total);

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
  const estudiante = await obtenerEstudiante(estudianteId);
  if (puntos <= 0) {
    throw new Error('Los puntos a canjear deben ser mayores a 0.');
  }
  if (puntos > estudiante.puntos) {
    throw new Error('Puntos insuficientes para el canje.');
  }
  const puntosRestantes = estudiante.puntos - puntos;

  const { error } = await supabase
    .from('estudiantes')
    .update({ puntos: puntosRestantes })
    .eq('id', estudianteId);

  if (error) throw new Error(error.message);
  return puntosRestantes;
}

const SANDWICHES_PARA_CAFE = 10;

/**
 * Registra sandwiches comprados. Cada 10 genera un cafe americano gratis (HU-07).
 * @param {string} estudianteId
 * @param {number} [cantidad=1]
 */
async function registrarSandwich(estudianteId, cantidad = 1) {
  const estudiante = await obtenerEstudiante(estudianteId);
  let totalSandwiches = estudiante.sandwiches + cantidad;
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
 * Retorna el resumen de beneficios del estudiante.
 * @param {string} estudianteId
 */
async function obtenerBeneficios(estudianteId) {
  const e = await obtenerEstudiante(estudianteId);
  
  const { data: progresos } = await supabase
    .from('progreso_fidelidad')
    .select('*')
    .eq('estudiante_id', estudianteId);

  const { data: reglas } = await supabase
    .from('reglas_fidelidad')
    .select('*')
    .eq('activo', true);

  const { data: productos } = await supabase
    .from('productos')
    .select('*');

  const prodMap = {};
  if (productos) {
    productos.forEach(p => { prodMap[p.id] = p; });
  }

  const reglasCriterioMap = {};
  if (reglas) {
    reglas.forEach(r => {
      reglasCriterioMap[r.producto_criterio_id] = r;
    });
  }

  const listaPremios = [];
  if (progresos) {
    progresos.forEach(p => {
      const regla = reglasCriterioMap[p.producto_criterio_id];
      if (regla) {
        listaPremios.push({
          id: p.id,
          cantidadAcumulada: p.cantidad_acumulada,
          premiosDisponibles: p.premios_disponibles,
          reglaNombre: regla.nombre,
          cantidadCriterio: regla.cantidad_criterio,
          productoCriterio: prodMap[regla.producto_criterio_id] ? prodMap[regla.producto_criterio_id].nombre : 'Producto',
          productoPremio: prodMap[regla.producto_premio_id] ? prodMap[regla.producto_premio_id].nombre : 'Premio',
          productoPremioId: regla.producto_premio_id
        });
      }
    });
  }

  return {
    puntos: e.puntos,
    sandwiches: e.sandwiches,
    cafesGratis: e.cafes_gratis || 0,
    sandwichesParaSiguienteCafe: Math.max(0, SANDWICHES_PARA_CAFE - e.sandwiches),
    premiosDinamicos: listaPremios
  };
}

/**
 * Canjea un cafe gratis del estudiante.
 * @param {string} estudianteId
 */
async function canjearCafeGratis(estudianteId) {
  const estudiante = await obtenerEstudiante(estudianteId);
  const cafesGratis = estudiante.cafes_gratis || 0;
  if (cafesGratis <= 0) throw new Error('No tienes cafes gratis disponibles.');
  
  const nuevosCafes = cafesGratis - 1;

  const { error } = await supabase
    .from('estudiantes')
    .update({ cafes_gratis: nuevosCafes })
    .eq('id', estudianteId);

  if (error) throw new Error(error.message);
  return { cafesGratis: nuevosCafes };
}

/**
 * Crea una nueva regla de fidelidad dinámica.
 */
async function crearReglaFidelidad({ nombre, productoCriterioId, cantidadCriterio, productoPremioId }) {
  if (!nombre || !productoCriterioId || !cantidadCriterio || !productoPremioId) {
    throw new Error('Todos los campos son requeridos para la regla.');
  }

  const nueva = {
    nombre: nombre.trim(),
    producto_criterio_id: productoCriterioId,
    cantidad_criterio: parseInt(cantidadCriterio, 10),
    producto_premio_id: productoPremioId,
    activo: true
  };

  const { data, error } = await supabase
    .from('reglas_fidelidad')
    .insert([nueva])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Lista las reglas de fidelidad activas.
 */
async function listarReglasFidelidad() {
  const { data, error } = await supabase
    .from('reglas_fidelidad')
    .select('*')
    .eq('activo', true);

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Obtiene el ranking de estudiantes ordenado por puntos de forma descendente.
 */
async function obtenerRankingClientes() {
  const { data, error } = await supabase
    .from('estudiantes')
    .select('id, nombre, codigo, correo, puntos, sandwiches, cafes_gratis')
    .order('puntos', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Actualiza el progreso de compra de un estudiante para un determinado producto
 * basándose en las reglas activas de fidelidad.
 */
async function actualizarProgresoCompra(estudianteId, productoId, cantidad) {
  const { data: reglas, error: errReglas } = await supabase
    .from('reglas_fidelidad')
    .select('*')
    .eq('producto_criterio_id', productoId)
    .eq('activo', true);

  if (errReglas) throw new Error(errReglas.message);
  if (!reglas || reglas.length === 0) return;

  for (const regla of reglas) {
    const { data: progreso, error: errProg } = await supabase
      .from('progreso_fidelidad')
      .select('*')
      .eq('estudiante_id', estudianteId)
      .eq('producto_criterio_id', productoId)
      .maybeSingle();

    if (errProg) throw new Error(errProg.message);

    let cantidadAcumulada = (progreso ? progreso.cantidad_acumulada : 0) + cantidad;
    let premiosDisponibles = progreso ? progreso.premios_disponibles : 0;

    const nuevasUnidadesPremio = Math.floor(cantidadAcumulada / regla.cantidad_criterio);
    if (nuevasUnidadesPremio > 0) {
      premiosDisponibles += nuevasUnidadesPremio;
      cantidadAcumulada = cantidadAcumulada % regla.cantidad_criterio;
    }

    if (progreso) {
      const { error: errUpd } = await supabase
        .from('progreso_fidelidad')
        .update({
          cantidad_acumulada: cantidadAcumulada,
          premios_disponibles: premiosDisponibles
        })
        .eq('id', progreso.id);
      if (errUpd) throw new Error(errUpd.message);
    } else {
      const { error: errIns } = await supabase
        .from('progreso_fidelidad')
        .insert([{
          estudiante_id: estudianteId,
          producto_criterio_id: productoId,
          cantidad_acumulada: cantidadAcumulada,
          premios_disponibles: premiosDisponibles
        }]);
      if (errIns) throw new Error(errIns.message);
    }
  }
}

/**
 * Canjea un premio acumulado de progreso de fidelidad dinámica.
 */
async function canjearPremio(estudianteId, progresoId) {
  const { data: progreso, error: errProg } = await supabase
    .from('progreso_fidelidad')
    .select('*')
    .eq('id', progresoId)
    .eq('estudiante_id', estudianteId)
    .maybeSingle();

  if (errProg) throw new Error(errProg.message);
  if (!progreso) throw new Error('Progreso de fidelidad no encontrado.');
  if (progreso.premios_disponibles <= 0) {
    throw new Error('No tienes premios disponibles para canjear.');
  }

  const nuevosPremios = progreso.premios_disponibles - 1;

  const { error: errUp } = await supabase
    .from('progreso_fidelidad')
    .update({ premios_disponibles: nuevosPremios })
    .eq('id', progresoId);

  if (errUp) throw new Error(errUp.message);
  return { ok: true, premiosDisponibles: nuevosPremios };
}

module.exports = {
  calcularPuntos,
  acreditarPuntos,
  canjearPuntos,
  registrarSandwich,
  obtenerBeneficios,
  canjearCafeGratis,
  crearReglaFidelidad,
  listarReglasFidelidad,
  obtenerRankingClientes,
  actualizarProgresoCompra,
  canjearPremio,
  SOLES_POR_PUNTO,
  SANDWICHES_PARA_CAFE,
};
