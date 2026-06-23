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
const Producto = require('../models/Producto');

const TABLA = 'productos';
const TABLA_CATEGORIAS = 'categorias';

function requireSupabase() {
  if (!supabase) {
    throw new Error('Supabase no esta configurado.');
  }
  return supabase;
}

function normalizarCategoriaId(datos = {}) {
  const valor = datos.categoria_id ?? datos.categoriaId;
  if (valor === undefined || valor === null || String(valor).trim() === '') {
    return null;
  }
  return String(valor).trim();
}

function serializarProducto(p) {
  if (!p) return undefined;
  return {
    id: p.id,
    nombre: p.nombre,
    descripcion: p.descripcion,
    precio: Number(p.precio),
    categoria: p.categoria,
    imagenUrl: p.imagen_url,
    disponible: p.disponible,
    activo: p.activo,
    motivoNoDisponible: p.motivo_no_disponible,
    razonAgotamiento: p.motivo_no_disponible,
    stock: p.stock ?? 0,
    categoriaId: p.categoria_id,
    categoria_id: p.categoria_id,
    creadoEn: p.creado_en
  };
}

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
 * @param {Object} datos { nombre, precio, descripcion?, categoria?, categoria_id?, imagen_url?, disponible?, stock? }
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
    stock: datos.stock ?? 15,
    categoria_id: normalizarCategoriaId(datos),
  };

  const { data, error } = await requireSupabase().from(TABLA).insert([nuevo]).select().single();
  if (error) {
    throw new Error(error.message);
  }
  return serializarProducto(data);
}

function productosQuery({ soloDisponibles = false } = {}) {
  let query = requireSupabase()
    .from(TABLA)
    .select('*')
    .eq('activo', true);

  if (soloDisponibles) {
    query = query.eq('disponible', true);
  }

  return query;
}

async function obtenerNombreCategoria(categoriaId) {
  if (!categoriaId) return null;

  const { data, error } = await requireSupabase()
    .from(TABLA_CATEGORIAS)
    .select('nombre')
    .eq('id', categoriaId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  return data?.nombre ?? null;
}

function combinarProductos(...listas) {
  const porId = new Map();
  listas.flat().forEach((producto) => {
    if (producto?.id) porId.set(producto.id, producto);
  });
  return [...porId.values()];
}

async function listarPorCategoriaCompatible(categoriaId, { soloDisponibles = false, orden = 'nombre' } = {}) {
  const { data: porId, error: errorPorId } = await productosQuery({ soloDisponibles })
    .eq('categoria_id', categoriaId)
    .order(orden, { ascending: orden !== 'creado_en' });

  if (errorPorId) {
    throw new Error(errorPorId.message);
  }

  const nombreCategoria = await obtenerNombreCategoria(categoriaId);
  if (!nombreCategoria) {
    return (porId || []).map(serializarProducto);
  }

  const { data: antiguos, error: errorAntiguos } = await productosQuery({ soloDisponibles })
    .eq('categoria', nombreCategoria)
    .is('categoria_id', null)
    .order(orden, { ascending: orden !== 'creado_en' });

  if (errorAntiguos) {
    throw new Error(errorAntiguos.message);
  }

  return combinarProductos(porId || [], antiguos || []).map(serializarProducto);
}

/**
 * Lista todos los productos activos (vista del dueño).
 * @param {string} [categoriaId]
 * @returns {Promise<Object[]>}
 */
async function listarProductos(categoriaId = null) {
  if (categoriaId) {
    return listarPorCategoriaCompatible(categoriaId, {
      soloDisponibles: false,
      orden: 'creado_en'
    });
  }

  const { data, error } = await productosQuery().order('creado_en', { ascending: false });
  if (error) {
    throw new Error(error.message);
  }
  return (data || []).map(serializarProducto);
}

/**
 * Lista los productos visibles para el estudiante: activos y disponibles.
 * @param {string} [categoriaId]
 * @returns {Promise<Object[]>}
 */
async function listarProductosDisponibles(categoriaId = null) {
  if (categoriaId) {
    return listarPorCategoriaCompatible(categoriaId, {
      soloDisponibles: true,
      orden: 'nombre'
    });
  }

  const { data, error } = await productosQuery({ soloDisponibles: true }).order('nombre', { ascending: true });
  if (error) {
    throw new Error(error.message);
  }
  return (data || []).map(serializarProducto);
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

  let stockDiff = 0;
  let viejoProducto = null;
  if (cambios.stock !== undefined) {
    viejoProducto = await obtenerProducto(id);
    if (viejoProducto) {
      stockDiff = cambios.stock - viejoProducto.stock;
    }
  }

  // Mapear campos si vienen en camelCase a snake_case para la BD
  const updateData = { ...cambios };
  if (cambios.imagenUrl !== undefined) {
    updateData.imagen_url = cambios.imagenUrl;
    delete updateData.imagenUrl;
  }
  if (cambios.motivoNoDisponible !== undefined) {
    updateData.motivo_no_disponible = cambios.motivoNoDisponible;
    delete updateData.motivoNoDisponible;
  }
  if (cambios.categoriaId !== undefined) {
    updateData.categoria_id = cambios.categoriaId || null;
    delete updateData.categoriaId;
  }

  const { data, error } = await requireSupabase().from(TABLA).update(updateData).eq('id', id).select().single();
  if (error) {
    throw new Error(error.message);
  }

  const actualizado = serializarProducto(data);

  if (stockDiff !== 0 && viejoProducto) {
    try {
      const stockService = require('./stockService');
      await stockService.registrarMovimiento({
        productoId: id,
        productoNombre: viejoProducto.nombre,
        categoria: viejoProducto.categoria,
        tipo: stockDiff > 0 ? 'INGRESO' : 'SALIDA',
        cantidad: Math.abs(stockDiff),
        motivo: stockDiff > 0 ? 'REPOSICION' : 'AJUSTE'
      });
    } catch (err) {
      console.error("Error al registrar movimiento de stock:", err.message);
    }
  }

  return actualizado;
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
  const { data, error } = await requireSupabase().from(TABLA).update(cambios).eq('id', id).select().single();
  if (error) {
    throw new Error(error.message);
  }
  return serializarProducto(data);
}

/**
 * Desactiva un producto (baja logica). Los productos nunca se eliminan.
 * @param {string} id
 * @returns {Promise<Object>} El producto desactivado.
 */
async function desactivarProducto(id) {
  const { data, error } = await requireSupabase()
    .from(TABLA)
    .update({ activo: false })
    .eq('id', id)
    .select()
    .single();
  if (error) {
    throw new Error(error.message);
  }
  return serializarProducto(data);
}

/**
 * Busca un producto por su id.
 * @param {string} id
 * @returns {Promise<Object|undefined>}
 */
async function obtenerProducto(id) {
  const { data, error } = await requireSupabase().from(TABLA).select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(error.message);
  return serializarProducto(data);
}

module.exports = {
  validarProducto,
  crearProducto,
  listarProductos,
  listarProductosDisponibles,
  actualizarProducto,
  cambiarDisponibilidadProducto,
  desactivarProducto,
  obtenerProducto,
};
