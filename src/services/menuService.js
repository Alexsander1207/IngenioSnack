/**
 * menuService
 * Lógica de negocio del menú de IngenioSnack (HU-01: Consultar menú disponible,
 * HU-04 parcial: Actualizar disponibilidad).
 */
const Producto = require('../models/Producto');
const { db } = require('../data/memoria'); // Desestructuramos db para mantener consistencia con otros servicios

/**
 * Registra un producto en el menú y lo guarda en memoria.
 * Genera un id automático en formato string si no se proporciona.
 * @param {Object} datosProducto { id?, nombre, precio, categoria, disponible }
 * @returns {Producto} El producto creado.
 */
function registrarProducto(datosProducto) {
  // Aseguramos que el ID sea un string consistente
  const idAutomatico = datosProducto.id 
    ? String(datosProducto.id) 
    : String(db.productos.length + 1);

  // Instanciamos el modelo Producto pasándole el objeto de datos completo
  const producto = new Producto({
    id: idAutomatico,
    nombre: datosProducto.nombre,
    precio: datosProducto.precio,
    categoria: datosProducto.categoria,
    disponible: datosProducto.disponible,
    imagenUrl: datosProducto.imagenUrl,
    stock: datosProducto.stock != null ? datosProducto.stock : 15,
  });

  db.productos.push(producto);
  return producto;
}

/**
 * Devuelve todos los productos registrados en el catálogo.
 * @returns {Producto[]}
 */
function listarProductos() {
  return db.productos;
}

/**
 * HU-01: Consultar menú disponible.
 * Devuelve solo los productos disponibles para la venta.
 * Si recibe un arreglo lo filtra; si no, filtra `db.productos`.
 * @param {Producto[]} [productos=db.productos]
 * @returns {Producto[]}
 */
function listarProductosDisponibles(productos = db.productos) {
  if (!productos || !Array.isArray(productos)) return [];
  return productos.filter((producto) => producto && producto.disponible === true);
}

/**
 * HU-04: Gestión de Menú (Actualizar disponibilidad).
 * Cambia la disponibilidad de un producto sin eliminarlo del catálogo general.
 * @param {string|number} id
 * @param {boolean} disponible
 * @returns {Producto|null} El producto actualizado, o null si no existe.
 */
function cambiarDisponibilidadProducto(id, disponible) {
  // Buscamos evaluando tanto si viene en formato numérico o string
  const producto = db.productos.find((p) => String(p.id) === String(id));
  if (!producto) return null;
  
  // BUENA PRÁCTICA POO: Usamos el método que encapsula la lógica en el modelo Producto
  producto.actualizarDisponibilidad(disponible);
  
  return producto;
}

/**
 * Busca un producto por su id de forma segura.
 * @param {string|number} id
 * @returns {Producto|undefined}
 */
function obtenerProducto(id) {
  return db.productos.find((p) => String(p.id) === String(id));
}

module.exports = {
  registrarProducto,
  agregarProducto: registrarProducto, // Alias por compatibilidad de tests
  listarProductos,
  listarProductosDisponibles,
  cambiarDisponibilidadProducto,
  obtenerProducto,
};