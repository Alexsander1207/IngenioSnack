/**
 * promocionService
 * Gestión de promociones/combos respaldada por Supabase.
 *
 * Reglas de negocio:
 *  - Una promoción debe tener nombre y precio > 0.
 *  - Debe incluir al menos un producto.
 *  - Las promociones NO se eliminan: se desactivan (activo = false).
 *  - El estudiante solo ve promociones activas y disponibles.
 */
const { supabase } = require('../config/supabaseClient');

const TABLA_PROMO = 'promociones';
const TABLA_ITEMS = 'items_promocion';

/**
 * Valida los datos mínimos de una promoción.
 * @param {Object} datos
 * @returns {string[]} Lista de errores (vacía si es válido).
 */
function validarPromocion(datos = {}) {
  const errores = [];

  if (!datos.nombre || String(datos.nombre).trim() === '') {
    errores.push('La promoción debe tener un nombre.');
  }

  if (typeof datos.precio !== 'number' || Number.isNaN(datos.precio) || datos.precio <= 0) {
    errores.push('El precio debe ser un número mayor a cero.');
  }

  if (!Array.isArray(datos.productos) || datos.productos.length === 0) {
    errores.push('La promoción debe incluir al menos un producto.');
  }

  return errores;
}

/**
 * Crea una promoción con sus productos asociados.
 * Inserta en `promociones` y luego en `items_promocion`.
 * @param {{ nombre: string, descripcion?: string, precio: number, productos: { productoId: string, cantidad: number }[] }} datos
 * @returns {Promise<Object>} La promoción creada con sus items.
 */
async function crearPromocion(datos) {
  const errores = validarPromocion(datos);
  if (errores.length > 0) {
    throw new Error(errores.join(' '));
  }

  // Validar que los productos existan
  for (const item of datos.productos) {
    const { data: producto, error } = await supabase
      .from('productos')
      .select('id, nombre')
      .eq('id', item.productoId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!producto) {
      throw new Error(`Producto no encontrado: ${item.productoId}`);
    }
  }

  // Insertar la promoción
  const nuevaPromo = {
    nombre: datos.nombre.trim(),
    descripcion: datos.descripcion || null,
    precio: datos.precio,
    disponible: true,
    activo: true,
  };

  const { data: promo, error: errPromo } = await supabase
    .from(TABLA_PROMO)
    .insert([nuevaPromo])
    .select()
    .single();

  if (errPromo) throw new Error(errPromo.message);

  // Insertar los items de la promoción
  const itemsInsert = datos.productos.map((p) => ({
    promocion_id: promo.id,
    producto_id: p.productoId,
    cantidad: p.cantidad || 1,
  }));

  const { error: errItems } = await supabase
    .from(TABLA_ITEMS)
    .insert(itemsInsert);

  if (errItems) throw new Error(errItems.message);

  // Retornar la promoción con sus items
  return obtenerPromocion(promo.id);
}

/**
 * Obtiene una promoción por su id con los productos asociados.
 * @param {string} id
 * @returns {Promise<Object|undefined>}
 */
async function obtenerPromocion(id) {
  const { data: promo, error: errPromo } = await supabase
    .from(TABLA_PROMO)
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (errPromo) throw new Error(errPromo.message);
  if (!promo) return undefined;

  const { data: items, error: errItems } = await supabase
    .from(TABLA_ITEMS)
    .select('*, productos(*)')
    .eq('promocion_id', id);

  if (errItems) throw new Error(errItems.message);

  return {
    ...promo,
    items: (items || []).map((it) => ({
      id: it.id,
      productoId: it.producto_id,
      cantidad: it.cantidad,
      producto: it.productos,
    })),
  };
}

/**
 * Lista todas las promociones activas con sus productos asociados.
 * @returns {Promise<Object[]>}
 */
async function listarPromociones() {
  const { data: promos, error: errPromos } = await supabase
    .from(TABLA_PROMO)
    .select('*')
    .eq('activo', true)
    .order('created_at', { ascending: false });

  if (errPromos) throw new Error(errPromos.message);

  const result = [];
  for (const promo of promos) {
    const { data: items, error: errItems } = await supabase
      .from(TABLA_ITEMS)
      .select('*, productos(*)')
      .eq('promocion_id', promo.id);

    if (errItems) throw new Error(errItems.message);

    result.push({
      ...promo,
      items: (items || []).map((it) => ({
        id: it.id,
        productoId: it.producto_id,
        cantidad: it.cantidad,
        producto: it.productos,
      })),
    });
  }

  return result;
}

/**
 * Desactiva una promoción (baja lógica). Las promociones nunca se eliminan.
 * @param {string} id
 * @returns {Promise<Object>} La promoción desactivada.
 */
async function desactivarPromocion(id) {
  const { data, error } = await supabase
    .from(TABLA_PROMO)
    .update({ activo: false })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Cambia la disponibilidad de una promoción sin eliminarla.
 * @param {string} id
 * @param {boolean} disponible
 * @returns {Promise<Object>} La promoción actualizada.
 */
async function cambiarDisponibilidadPromocion(id, disponible) {
  const { data, error } = await supabase
    .from(TABLA_PROMO)
    .update({ disponible })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

module.exports = {
  validarPromocion,
  crearPromocion,
  obtenerPromocion,
  listarPromociones,
  desactivarPromocion,
  cambiarDisponibilidadPromocion,
};
