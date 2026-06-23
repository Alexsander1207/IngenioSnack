/**
 * categoriaService
 * Servicio para gestionar categorías de productos en Supabase.
 */
const { supabase } = require('../config/supabaseClient');

const TABLA = 'categorias';
const TABLA_PRODUCTOS = 'productos';

/**
 * Lista todas las categorías ordenadas por nombre.
 * @returns {Promise<Object[]>}
 */
async function listarCategorias() {
  if (!supabase) {
    throw new Error('Supabase no esta configurado.');
  }

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
  if (!supabase) {
    throw new Error('Supabase no esta configurado.');
  }

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
  if (!id) {
    throw new Error('El id de la categoria es requerido.');
  }
  if (!supabase) {
    throw new Error('Supabase no esta configurado.');
  }

  const { error: updateError } = await supabase
    .from(TABLA_PRODUCTOS)
    .update({ categoria_id: null })
    .eq('categoria_id', id);
  if (updateError) throw new Error(updateError.message);

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
