/**
 * Modelo Pedido
 * Representa un pedido realizado por un estudiante. Agrupa varios ItemPedido
 * y controla su estado dentro del flujo de la cafetería.
 */

/** Estados válidos por los que transita un pedido. */
const ESTADOS = Object.freeze({
  PENDIENTE:       'PENDIENTE',
  CONFIRMADO:      'CONFIRMADO',
  EN_PREPARACION:  'EN_PREPARACION',
  LISTO:           'LISTO',
  RECOGIDO:        'RECOGIDO',
  ENTREGADO:       'RECOGIDO', // Alias for RECOGIDO
  CANCELADO:       'CANCELADO',
});

class Pedido {
  /**
   * @param {Object} datos
   * @param {string} datos.id           Identificador único del pedido.
   * @param {string} datos.estudianteId Id del estudiante que pide.
   * @param {import('./ItemPedido')[]} [datos.items=[]] Items del pedido.
   * @param {string} [datos.estado=PENDIENTE] Estado inicial.
   * @param {Date}   [datos.fecha=new Date()] Fecha de creación.
   */
  constructor({ id, estudianteId, items = [], estado = ESTADOS.PENDIENTE, fecha = new Date() }) {
    this.id = id;
    this.estudianteId = estudianteId;
    this.items = items;
    // Validar que el estado inicial provenga de la lista permitida
    this.estado = Object.values(ESTADOS).includes(estado) ? estado : ESTADOS.PENDIENTE;
    this.fecha = fecha instanceof Date ? fecha : new Date(fecha);
  }

  /**
   * Calcula el total del pedido sumando los subtotales de cada item.
   * @returns {number} Total en soles.
   */
  get total() {
    // Si no hay ítems válidos, el total es 0
    if (!this.items || !Array.isArray(this.items)) return 0;
    
    // Suma acumulada de los subtotales
    return this.items.reduce((acc, item) => {
      const subtotalItem = item && typeof item.subtotal === 'number' ? item.subtotal : 0;
      return acc + subtotalItem;
    }, 0);
  }

  /**
   * HU-03: Permite avanzar el estado del pedido en la cola de la cafetería de forma lógica.
   * Valida que no se salten transiciones de estado incorrectas.
   * @param {string} nuevoEstado 
   * @returns {boolean} true si el cambio fue válido, false si no.
   */
  cambiarEstado(nuevoEstado) {
    if (!Object.values(ESTADOS).includes(nuevoEstado)) return false;

    // Control de flujo lógico del ciclo de vida del pedido
    switch (this.estado) {
      case ESTADOS.PENDIENTE:
        // Un pedido pendiente puede confirmarse o cancelarse directamente
        if (nuevoEstado === ESTADOS.CONFIRMADO || nuevoEstado === ESTADOS.CANCELADO) {
          this.estado = nuevoEstado;
          return true;
        }
        break;

      case ESTADOS.CONFIRMADO:
        // De confirmado pasa a cocina o se cancela si hay problemas de stock/insumos
        if (nuevoEstado === ESTADOS.EN_PREPARACION || nuevoEstado === ESTADOS.CANCELADO) {
          this.estado = nuevoEstado;
          return true;
        }
        break;

      case ESTADOS.EN_PREPARACION:
        // Una vez que se empezó a cocinar, pasa a LISTO para que el estudiante lo recoja
        if (nuevoEstado === ESTADOS.LISTO) {
          this.estado = nuevoEstado;
          return true;
        }
        break;

      case ESTADOS.LISTO:
        // El paso final es la entrega al estudiante en el mostrador
        if (nuevoEstado === ESTADOS.ENTREGADO) {
          this.estado = nuevoEstado;
          return true;
        }
        break;

      case ESTADOS.ENTREGADO:
      case ESTADOS.CANCELADO:
        // Estados finales: No se pueden alterar una vez alcanzados
        return false;
    }

    return false; // Transición no permitida
  }

  /**
   * Criterio de aceptación (HU-03 / Cancelaciones): Permite al estudiante o encargado cancelar el pedido
   * siempre y cuando no esté ya en preparación, listo o entregado.
   * @returns {boolean} true si se pudo cancelar con éxito, false en caso contrario.
   */
  cancelarPedido() {
    return this.cambiarEstado(ESTADOS.CANCELADO);
  }

  /**
   * Agrega un nuevo ítem al pedido de forma dinámica si el flujo lo permite (en estado PENDIENTE).
   * @param {import('./ItemPedido')} item 
   * @returns {boolean}
   */
  agregarItem(item) {
    if (this.estado !== ESTADOS.PENDIENTE) return false;
    if (!item || typeof item.subtotal !== 'number') return false;
    
    this.items.push(item);
    return true;
  }
}

module.exports = Pedido;
module.exports.ESTADOS = ESTADOS;