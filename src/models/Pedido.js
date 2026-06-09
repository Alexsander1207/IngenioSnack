/**
 * Modelo Pedido
 * Representa un pedido realizado por un estudiante. Agrupa varios ItemPedido
 * y controla su estado dentro del flujo de la cafeteria.
 */

/** Estados validos por los que transita un pedido. */
const ESTADOS = Object.freeze({
  PENDIENTE: 'PENDIENTE',
  CONFIRMADO: 'CONFIRMADO',
  EN_PREPARACION: 'EN_PREPARACION',
  LISTO: 'LISTO',
  ENTREGADO: 'ENTREGADO',
  CANCELADO: 'CANCELADO',
});

class Pedido {
  /**
   * @param {Object} datos
   * @param {string} datos.id           Identificador unico del pedido.
   * @param {string} datos.estudianteId Id del estudiante que pide.
   * @param {import('./ItemPedido')[]} [datos.items=[]] Items del pedido.
   * @param {string} [datos.estado=PENDIENTE] Estado inicial.
   * @param {Date}   [datos.fecha=new Date()] Fecha de creacion.
   */
  constructor({ id, estudianteId, items = [], estado = ESTADOS.PENDIENTE, fecha = new Date() }) {
    this.id = id;
    this.estudianteId = estudianteId;
    this.items = items;
    this.estado = estado;
    this.fecha = fecha;
  }

  /**
   * Calcula el total del pedido sumando los subtotales de cada item.
   * @returns {number} Total en soles.
   */
  get total() {
    return this.items.reduce((acc, item) => acc + item.subtotal, 0);
  }
}

module.exports = Pedido;
module.exports.ESTADOS = ESTADOS;
