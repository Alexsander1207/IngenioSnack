/**
 * menuService
 * Gestiona el menu de la cafeteria: alta y consulta de productos disponibles.
 */
const Producto = require('../models/Producto');
const { db } = require('../data/memoria');

/**
 * Agrega un nuevo producto al menu.
 * @param {Object} datos Datos del producto (ver modelo Producto).
 * @returns {Producto} El producto creado.
 */
function agregarProducto(datos) {
  const producto = new Producto(datos);
  db.productos.push(producto);
  return producto;
}

/**
 * Lista todos los productos del menu.
 * @returns {Producto[]}
 */
function listarProductos() {
  return db.productos;
}

/**
 * Lista unicamente los productos marcados como disponibles.
 * @returns {Producto[]}
 */
function listarDisponibles() {
  return db.productos.filter((p) => p.disponible);
}

/**
 * Busca un producto por su id.
 * @param {string} id
 * @returns {Producto|undefined}
 */
function obtenerProducto(id) {
  return db.productos.find((p) => p.id === id);
}

module.exports = {
  agregarProducto,
  listarProductos,
  listarDisponibles,
  obtenerProducto,
};
