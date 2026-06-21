/**
 * Modelo Producto
 * Representa un item del menu de la cafeteria IngenioSnack.
 */
class Producto {
  /**
   * @param {Object} datos
   * @param {string} datos.id        Identificador unico del producto.
   * @param {string} datos.nombre    Nombre del producto (ej. "Empanada de pollo").
   * @param {number} datos.precio    Precio unitario en soles.
   * @param {string} datos.categoria Categoria (ej. "comida", "bebida", "snack").
   * @param {boolean} [datos.disponible=true] Si el producto se puede pedir.
   */
  constructor({ id, nombre, precio, categoria, disponible = true, imagenUrl = null, stock = 15 }) {
    this.id = id;
    this.nombre = nombre;
    this.precio = precio;
    this.categoria = categoria;
    this.disponible = disponible;
    this.imagenUrl = imagenUrl;
    this.stock = stock;
  }
}

module.exports = Producto;
