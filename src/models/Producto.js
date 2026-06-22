/**
 * Modelo Producto
 * Representa un ítem del menú de la cafetería IngenioSnack.
 */
class Producto {
  /**
   * @param {Object} datos
   * @param {string} datos.id        Identificador único del producto.
   * @param {string} datos.nombre    Nombre del producto (ej. "Empanada de pollo").
   * @param {number} datos.precio    Precio unitario en soles.
   * @param {string} datos.categoria Categoría (ej. "comida", "bebida", "snack").
   * @param {boolean} [datos.disponible=true] Si el producto se puede pedir.
   */
  constructor({ id, nombre, precio, categoria, disponible = true, imagenUrl = null, stock = 15 }) {
    this.id = id;
    this.nombre = nombre;
    // Restricción del sistema: El precio base no puede ser negativo
    this.precio = typeof precio === 'number' && precio >= 0 ? precio : 0;
    this.categoria = categoria;
    this.disponible = disponible;
    this.imagenUrl = imagenUrl;
    this.stock = stock;
  }

  /**
   * HU-04: Gestión de Menú e Inventario.
   * Permite al encargado cambiar la disponibilidad de un producto en tiempo real
   * cuando se agota en el mostrador/cocina.
   * @param {boolean} estado 
   */
  actualizarDisponibilidad(estado) {
    if (typeof estado === 'boolean') {
      this.disponible = estado;
    }
  }

  /**
   * HU-04: Actualizar precio del producto según el mercado o promociones.
   * @param {number} nuevoPrecio 
   * @returns {boolean} true si se actualizó correctamente, false si el precio es inválido.
   */
  actualizarPrecio(nuevoPrecio) {
    if (typeof nuevoPrecio !== 'number' || nuevoPrecio < 0) {
      return false;
    }
    this.precio = nuevoPrecio;
    return true;
  }

  /**
   * HU-02: Sistema de fidelidad y canjes.
   * Calcula de forma dinámica cuántos puntos se requieren para obtener este producto gratis.
   * Regla de negocio derivada: Si un producto cuesta S/ 1.00, equivale a un costo de canje proporcional 
   * (por ejemplo, x10 o x15 puntos el valor del producto, según defina la administración).
   * Si el documento define puntos fijos por producto, este método sirve de interfaz.
   * @param {number} factorMultiplicador - Factor para convertir precio a puntos (por defecto 10).
   * @returns {number} Puntos necesarios para el canje.
   */
  calcularPuntosParaCanje(factorMultiplicador = 10) {
    if (!this.disponible) return Infinity; // Si no está disponible, no se puede canjear
    return Math.ceil(this.precio * factorMultiplicador);
  }
}

module.exports = Producto;