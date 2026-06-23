/**
 * categoriaService
 * Servicio para gestionar categorías de productos en Supabase.
 */
const { supabase } = require('../config/supabaseClient');

const TABLA = 'categorias';

/**
 * Lista todas las categorías ordenadas por nombre.
 * @returns {Promise<Object[]>}
 */
async function listarCategorias() {
  const { data, error } = await supabase
    .from(TABLA)
    .select('*')
    .order('nombre', { ascending: true });
  if (error) throw new Error(error.message);
  return data;
}

/**
 * Crea una nueva categoría.
 * @param {string} nombre
 * @returns {Promise<Object>}
 */
async function crearCategoria(nombre) {
  if (!nombre || nombre.trim() === '') {
    throw new Error('El nombre de la categoría es requerido.');
  }

  const { data, error } = await supabase
    .from(TABLA)
    .insert([{ nombre: nombre.trim() }])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Elimina una categoría por su ID.
 * @param {string} id
 * @returns {Promise<void>}
 */
async function eliminarCategoria(id) {
  const { error } = await supabase
    .from(TABLA)
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}

module.exports = {
  listarCategorias,
  crearCategoria,
  eliminarCategoria,
};
