/**
 * menuService
 * Logica de negocio del menu de IngenioSnack (HU-01: Consultar menu disponible,
 * HU-04 parcial: Actualizar disponibilidad).
 */
const Producto = require('../models/Producto');
const memoria = require('../data/memoria');

/**
 * Registra un producto en el menu y lo guarda en memoria.
 * Genera un id automatico si no se proporciona.
 * @param {Object} datosProducto { id?, nombre, precio, categoria, disponible }
 * @returns {Producto} El producto creado.
 */
function registrarProducto(datosProducto) {
  const producto = new Producto({
    id: datosProducto.id || memoria.productos.length + 1,
    nombre: datosProducto.nombre,
    precio: datosProducto.precio,
    categoria: datosProducto.categoria,
    disponible: datosProducto.disponible,
    imagenUrl: datosProducto.imagenUrl,
    stock: datosProducto.stock != null ? datosProducto.stock : 15,
  });

  memoria.productos.push(producto);
  return producto;
}

/**
 * Devuelve todos los productos registrados.
 * @returns {Producto[]}
 */
function listarProductos() {
  return memoria.productos;
}

/**
 * Devuelve solo los productos disponibles.
 * Si recibe un arreglo lo filtra; si no, filtra `memoria.productos`.
 * @param {Producto[]} [productos=memoria.productos]
 * @returns {Producto[]}
 */
function listarProductosDisponibles(productos = memoria.productos) {
  return productos.filter((producto) => producto.disponible === true);
}

/**
 * Cambia la disponibilidad de un producto sin eliminarlo.
 * @param {string|number} id
 * @param {boolean} disponible
 * @returns {Producto|null} El producto actualizado, o null si no existe.
 */
function cambiarDisponibilidadProducto(id, disponible) {
  const producto = memoria.productos.find((p) => p.id === id);
  if (!producto) return null;
  producto.disponible = disponible;
  return producto;
}

/**
 * Busca un producto por su id.
 * @param {string|number} id
 * @returns {Producto|undefined}
 */
function obtenerProducto(id) {
  return memoria.productos.find((p) => p.id === id);
}

module.exports = {
  registrarProducto,
  agregarProducto: registrarProducto,
  listarProductos,
  listarProductosDisponibles,
  cambiarDisponibilidadProducto,
  obtenerProducto,
};
