/**
 * Modelo ItemPedido
 * Representa una linea de un pedido: un producto y su cantidad.
 */
class ItemPedido {
  /**
   * @param {import('./Producto')} producto Producto seleccionado.
   * @param {number} cantidad Cantidad de unidades (debe ser >= 1).
   */
  constructor(producto, cantidad) {
    this.producto = producto;
    this.cantidad = cantidad;
  }

  /**
   * Calcula el subtotal de la linea (precio unitario * cantidad).
   * @returns {number} Subtotal en soles.
   */
  get subtotal() {
    return this.producto.precio * this.cantidad;
  }
}

module.exports = ItemPedido;
