/**
 * pedidoService
 * Gestiona el ciclo de vida de los pedidos: creacion, validacion,
 * confirmacion, consulta y cambio de estado.
 */
const Pedido = require('../models/Pedido');
const ItemPedido = require('../models/ItemPedido');
const { ESTADOS } = require('../models/Pedido');
const menuService = require('./menuService');
const { db } = require('../data/memoria');

let contador = 0;

function generarId() {
  contador += 1;
  return `PED-${String(contador).padStart(4, '0')}`;
}

/**
 * Calcula el total de un pedido a partir de sus items.
 * @param {{ precioUnitario: number, cantidad: number }[]} itemsPedido
 * @returns {number}
 */
function calcularTotalPedido(itemsPedido) {
  return itemsPedido.reduce((total, item) => {
    return total + item.precioUnitario * item.cantidad;
  }, 0);
}

/**
 * Valida que todos los productos de un pedido esten disponibles.
 * @param {{ items: { producto: { disponible: boolean } }[] }} pedido
 * @returns {{ valido: boolean, mensaje: string }}
 */
function validarDisponibilidadPedido(pedido) {
  const hayNoDisponible = pedido.items.some(
    (item) => item.producto.disponible === false
  );

  if (hayNoDisponible) {
    return {
      valido: false,
      mensaje: 'El pedido contiene productos no disponibles',
    };
  }

  return {
    valido: true,
    mensaje: 'Todos los productos estan disponibles',
  };
}

/**
 * Crea un pedido a partir de una lista de items {productoId, cantidad}.
 * Lanza error si algun producto no existe o no esta disponible.
 * @param {string} estudianteId
 * @param {{productoId: string, cantidad: number}[]} lineas
 * @returns {Pedido}
 */
function crearPedido(estudianteId, lineas) {
  if (!Array.isArray(lineas) || lineas.length === 0) {
    throw new Error('El pedido debe tener al menos un item.');
  }

  const items = lineas.map(({ productoId, cantidad }) => {
    const producto = menuService.obtenerProducto(productoId);
    if (!producto) {
      throw new Error(`Producto no encontrado: ${productoId}`);
    }
    if (!producto.disponible) {
      throw new Error(`Producto no disponible: ${producto.nombre}`);
    }
    if (cantidad < 1) {
      throw new Error('La cantidad debe ser al menos 1.');
    }
    return new ItemPedido(producto, cantidad);
  });

  const pedido = new Pedido({ id: generarId(), estudianteId, items });
  db.pedidos.push(pedido);
  return pedido;
}

/**
 * Confirma un pedido verificando disponibilidad. Cambia estado a CONFIRMADO.
 * @param {string} pedidoId
 * @returns {Pedido}
 */
function confirmarPedido(pedidoId) {
  const pedido = obtenerPedido(pedidoId);
  if (!pedido) {
    throw new Error(`Pedido no encontrado: ${pedidoId}`);
  }

  const pedidoParaValidar = {
    items: pedido.items.map((item) => ({ producto: item.producto })),
  };

  const validacion = validarDisponibilidadPedido(pedidoParaValidar);
  if (!validacion.valido) {
    throw new Error(validacion.mensaje);
  }

  pedido.estado = ESTADOS.CONFIRMADO;
  return pedido;
}

/**
 * Busca un pedido por su id.
 * @param {string} id
 * @returns {Pedido|undefined}
 */
function obtenerPedido(id) {
  return db.pedidos.find((p) => p.id === id);
}

/**
 * Cambia el estado de un pedido.
 * @param {string} id
 * @param {string} nuevoEstado Debe ser uno de Pedido.ESTADOS.
 * @returns {Pedido}
 */
function cambiarEstado(id, nuevoEstado) {
  if (!Object.values(ESTADOS).includes(nuevoEstado)) {
    throw new Error(`Estado invalido: ${nuevoEstado}`);
  }
  const pedido = obtenerPedido(id);
  if (!pedido) {
    throw new Error(`Pedido no encontrado: ${id}`);
  }
  pedido.estado = nuevoEstado;
  return pedido;
}

module.exports = {
  calcularTotalPedido,
  validarDisponibilidadPedido,
  crearPedido,
  confirmarPedido,
  obtenerPedido,
  cambiarEstado,
};
