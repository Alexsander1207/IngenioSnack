/**
 * productoService
 * Gestion de productos del menu respaldada por Supabase (Sprint 1, HU-01 y HU-04).
 *
 * Reglas de negocio:
 *  - No se registra un producto sin nombre.
 *  - No se registra un producto con precio <= 0.
 *  - Los productos NO se eliminan: se desactivan (activo = false).
 *  - El estudiante solo ve productos disponibles y activos.
 */
const { supabase } = require('../config/supabaseClient');

const TABLA = 'productos';

/**
 * Valida los datos minimos de un producto.
 * @param {Object} datos
 * @returns {string[]} Lista de errores (vacia si es valido).
 */
function validarProducto(datos = {}) {
  const errores = [];

  if (!datos.nombre || String(datos.nombre).trim() === '') {
    errores.push('El producto debe tener un nombre.');
  }

  if (typeof datos.precio !== 'number' || Number.isNaN(datos.precio) || datos.precio <= 0) {
    errores.push('El precio debe ser un numero mayor a cero.');
  }

  return errores;
}

/**
 * Registra un nuevo producto. El producto nace activo.
 * @param {Object} datos { nombre, precio, descripcion?, categoria?, imagen_url?, disponible? }
 * @returns {Promise<Object>} El producto creado.
 */
async function crearProducto(datos) {
  const errores = validarProducto(datos);
  if (errores.length > 0) {
    throw new Error(errores.join(' '));
  }

  const nuevo = {
    nombre: datos.nombre,
    descripcion: datos.descripcion ?? null,
    precio: datos.precio,
    categoria: datos.categoria ?? null,
    imagen_url: datos.imagen_url ?? null,
    disponible: datos.disponible ?? true,
    activo: true,
    motivo_no_disponible: datos.motivo_no_disponible ?? null,
  };

  const { data, error } = await supabase.from(TABLA).insert([nuevo]).select().single();
  if (error) {
    throw new Error(error.message);
  }
  return data;
}

/**
 * Lista todos los productos activos (vista del dueño).
 * @returns {Promise<Object[]>}
 */
async function listarProductos() {
  const { data, error } = await supabase
    .from(TABLA)
    .select('*')
    .eq('activo', true)
    .order('creado_en', { ascending: false });
  if (error) {
    throw new Error(error.message);
  }
  return data;
}

/**
 * Lista los productos visibles para el estudiante: activos y disponibles.
 * @returns {Promise<Object[]>}
 */
async function listarProductosDisponibles() {
  const { data, error } = await supabase
    .from(TABLA)
    .select('*')
    .eq('activo', true)
    .eq('disponible', true)
    .order('nombre', { ascending: true });
  if (error) {
    throw new Error(error.message);
  }
  return data;
}

/**
 * Actualiza los datos de un producto.
 * @param {string} id
 * @param {Object} cambios
 * @returns {Promise<Object>} El producto actualizado.
 */
async function actualizarProducto(id, cambios = {}) {
  if (
    cambios.precio !== undefined &&
    (typeof cambios.precio !== 'number' || cambios.precio <= 0)
  ) {
    throw new Error('El precio debe ser un numero mayor a cero.');
  }

  const { data, error } = await supabase.from(TABLA).update(cambios).eq('id', id).select().single();
  if (error) {
    throw new Error(error.message);
  }
  return data;
}

/**
 * Cambia la disponibilidad de un producto sin eliminarlo.
 * @param {string} id
 * @param {boolean} disponible
 * @param {string|null} [motivo] Motivo cuando se marca como no disponible.
 * @returns {Promise<Object>} El producto actualizado.
 */
async function cambiarDisponibilidadProducto(id, disponible, motivo = null) {
  const cambios = {
    disponible,
    motivo_no_disponible: disponible ? null : motivo,
  };
  const { data, error } = await supabase.from(TABLA).update(cambios).eq('id', id).select().single();
  if (error) {
    throw new Error(error.message);
  }
  return data;
}

/**
 * Desactiva un producto (baja logica). Los productos nunca se eliminan.
 * @param {string} id
 * @returns {Promise<Object>} El producto desactivado.
 */
async function desactivarProducto(id) {
  const { data, error } = await supabase
    .from(TABLA)
    .update({ activo: false })
    .eq('id', id)
    .select()
    .single();
  if (error) {
    throw new Error(error.message);
  }
  return data;
}

module.exports = {
  validarProducto,
  crearProducto,
  listarProductos,
  listarProductosDisponibles,
  actualizarProducto,
  cambiarDisponibilidadProducto,
  desactivarProducto,
};
