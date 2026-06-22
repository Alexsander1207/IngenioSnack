/**
 * pedidoService
 * Gestiona el ciclo de vida de los pedidos usando la base de datos de Supabase.
 */
const { supabase } = require('../config/supabaseClient');
const { ESTADOS } = require('../models/Pedido');

/**
 * Genera un ID secuencial de pedido consultando la base de datos.
 * @returns {Promise<string>}
 */
async function generarId() {
  const { count, error } = await supabase
    .from('pedidos')
    .select('*', { count: 'exact', head: true });
  if (error) throw new Error(error.message);
  const num = (count || 0) + 1;
  return `PED-${String(num).padStart(4, '0')}`;
}

/**
 * Calcula el subtotal de una linea de pedido.
 * @param {{ precioUnitario?: number, producto?: { precio: number }, cantidad: number }} item
 * @returns {number}
 */
function calcularSubtotal(item) {
  const precio = item.precioUnitario != null
    ? item.precioUnitario
    : (item.producto && item.producto.precio);
  return precio * item.cantidad;
}

/**
 * Calcula el total de un pedido a partir de sus items.
 * @param {Array} itemsPedido
 * @returns {number}
 */
function calcularTotalPedido(itemsPedido) {
  return itemsPedido.reduce((total, item) => total + calcularSubtotal(item), 0);
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
    text: 'Todos los productos estan disponibles',
  };
}

/**
 * Crea un pedido a partir de una lista de items.
 * Cada línea puede tener {productoId, cantidad} para producto individual
 * o {promocionId, cantidad} para un combo/promoción.
 * Lanza error si algún producto/promoción no existe o no está disponible.
 * @param {string} estudianteId
 * @param {{productoId?: string, promocionId?: string, cantidad: number}[]} lineas
 * @returns {Promise<Object>}
 */
async function crearPedido(estudianteId, lineas) {
  if (!Array.isArray(lineas) || lineas.length === 0) {
    throw new Error('El pedido debe tener al menos un item.');
  }

  const itemsToCreate = [];
  // Stock changes to apply: { productoId: { producto, cantidadTotal } }
  const stockChanges = {};
  let totalPedido = 0;

  for (const linea of lineas) {
    const cantidad = linea.cantidad;
    if (cantidad < 1) {
      throw new Error('La cantidad debe ser al menos 1.');
    }

    if (linea.promocionId) {
      // ── Línea de COMBO/PROMOCIÓN ────────────────────────────
      const { data: promo, error: errPromo } = await supabase
        .from('promociones')
        .select('*')
        .eq('id', linea.promocionId)
        .maybeSingle();

      if (errPromo) throw new Error(errPromo.message);
      if (!promo) throw new Error(`Promoción no encontrada: ${linea.promocionId}`);
      if (!promo.activo) throw new Error(`Promoción no activa: ${promo.nombre}`);
      if (!promo.disponible) throw new Error(`Promoción no disponible: ${promo.nombre}`);

      // Obtener los productos que componen el combo
      const { data: promoItems, error: errPI } = await supabase
        .from('items_promocion')
        .select('*, productos(*)')
        .eq('promocion_id', promo.id);

      if (errPI) throw new Error(errPI.message);

      // Validar stock de cada producto individual del combo
      for (const pi of promoItems) {
        const prod = pi.productos;
        const cantidadNecesaria = pi.cantidad * cantidad; // cantidad del item × cantidad del combo pedido
        if (!prod.disponible) {
          throw new Error(`Producto del combo no disponible: ${prod.nombre}`);
        }

        // Acumular stock changes
        if (!stockChanges[prod.id]) {
          stockChanges[prod.id] = { producto: prod, cantidadTotal: 0 };
        }
        stockChanges[prod.id].cantidadTotal += cantidadNecesaria;
      }

      // Usar el precio especial de la promoción
      totalPedido += promo.precio * cantidad;

      itemsToCreate.push({
        tipo: 'promocion',
        promocion: promo,
        promoItems,
        cantidad,
        precioUnitario: promo.precio,
      });

    } else if (linea.productoId) {
      // ── Línea de PRODUCTO INDIVIDUAL ────────────────────────
      const { data: producto, error: errProd } = await supabase
        .from('productos')
        .select('*')
        .eq('id', linea.productoId)
        .maybeSingle();

      if (errProd) throw new Error(errProd.message);
      if (!producto) throw new Error(`Producto no encontrado: ${linea.productoId}`);
      if (!producto.disponible) throw new Error(`Producto no disponible: ${producto.nombre}`);

      // Acumular stock changes
      if (!stockChanges[producto.id]) {
        stockChanges[producto.id] = { producto, cantidadTotal: 0 };
      }
      stockChanges[producto.id].cantidadTotal += cantidad;

      totalPedido += producto.precio * cantidad;

      itemsToCreate.push({
        tipo: 'producto',
        producto,
        cantidad,
        precioUnitario: producto.precio,
      });

    } else {
      throw new Error('Cada línea debe tener productoId o promocionId.');
    }
  }

  // Validar stock acumulado y descontar
  for (const [prodId, { producto, cantidadTotal }] of Object.entries(stockChanges)) {
    if (producto.stock < cantidadTotal) {
      throw new Error(
        `Stock insuficiente para ${producto.nombre}. Disponible: ${producto.stock}, necesario: ${cantidadTotal}`
      );
    }

    const nuevoStock = producto.stock - cantidadTotal;
    const cambios = { stock: nuevoStock };
    if (nuevoStock === 0) {
      cambios.disponible = false;
      cambios.motivo_no_disponible = 'Agotado por pedidos de estudiantes';
    }

    const { error: errUp } = await supabase
      .from('productos')
      .update(cambios)
      .eq('id', prodId);

    if (errUp) throw new Error(errUp.message);
  }

  const pedidoId = await generarId();

  // Insertar pedido
  const nuevoPedido = {
    id: pedidoId,
    estudiante_id: estudianteId,
    estado: 'PENDIENTE',
    total: totalPedido,
  };

  const { error: errPed } = await supabase.from('pedidos').insert([nuevoPedido]);
  if (errPed) throw new Error(errPed.message);

  // Insertar items del pedido
  const itemsInsert = itemsToCreate.map((item) => {
    if (item.tipo === 'promocion') {
      return {
        pedido_id: pedidoId,
        producto_id: item.promoItems[0]?.productos?.id || null,
        promocion_id: item.promocion.id,
        cantidad: item.cantidad,
        precio_unitario: item.precioUnitario,
      };
    }
    return {
      pedido_id: pedidoId,
      producto_id: item.producto.id,
      cantidad: item.cantidad,
      precio_unitario: item.precioUnitario,
    };
  });

  const { error: errItems } = await supabase.from('items_pedido').insert(itemsInsert);
  if (errItems) throw new Error(errItems.message);

  return {
    id: pedidoId,
    estudianteId,
    estado: 'PENDIENTE',
    total: totalPedido,
    items: itemsToCreate.map((item) => {
      if (item.tipo === 'promocion') {
        return {
          promocion: item.promocion,
          cantidad: item.cantidad,
          subtotal: item.precioUnitario * item.cantidad,
        };
      }
      return {
        producto: item.producto,
        cantidad: item.cantidad,
        subtotal: item.precioUnitario * item.cantidad,
      };
    }),
  };
}

/**
 * Busca un pedido por su id.
 * @param {string} id
 * @returns {Promise<Object|undefined>}
 */
async function obtenerPedido(id) {
  const { data: pedido, error: errPed } = await supabase
    .from('pedidos')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (errPed) throw new Error(errPed.message);
  if (!pedido) return undefined;

  const { data: items, error: errItems } = await supabase
    .from('items_pedido')
    .select('*, productos(*)')
    .eq('pedido_id', id);

  if (errItems) throw new Error(errItems.message);

  return {
    id: pedido.id,
    estudianteId: pedido.estudiante_id,
    estado: pedido.estado,
    total: pedido.total,
    creadoEn: pedido.creado_en,
    items: items.map((it) => ({
      cantidad: it.cantidad,
      precioUnitario: it.precio_unitario,
      producto: it.productos,
      subtotal: it.precio_unitario * it.cantidad,
    })),
  };
}

/**
 * Confirma un pedido verificando disponibilidad. Cambia estado a CONFIRMADO.
 * @param {string} pedidoId
 * @returns {Promise<Object>}
 */
async function confirmarPedido(pedidoId) {
  const pedido = await obtenerPedido(pedidoId);
  if (!pedido) {
    throw new Error(`Pedido no encontrado: ${pedidoId}`);
  }

  const validacion = validarDisponibilidadPedido(pedido);
  if (!validacion.valido) {
    throw new Error(validacion.mensaje);
  }

  const { error } = await supabase
    .from('pedidos')
    .update({ estado: ESTADOS.CONFIRMADO })
    .eq('id', pedidoId);

  if (error) throw new Error(error.message);
  pedido.estado = ESTADOS.CONFIRMADO;
  return pedido;
}

/**
 * Cambia el estado de un pedido.
 * @param {string} id
 * @param {string} nuevoEstado Debe ser uno de Pedido.ESTADOS.
 * @returns {Promise<Object>}
 */
async function cambiarEstado(id, nuevoEstado) {
  if (!Object.values(ESTADOS).includes(nuevoEstado)) {
    throw new Error(`Estado invalido: ${nuevoEstado}`);
  }
  const pedido = await obtenerPedido(id);
  if (!pedido) {
    throw new Error(`Pedido no encontrado: ${id}`);
  }

  // Devolver stock si se cancela
  if (nuevoEstado === ESTADOS.CANCELADO && pedido.estado !== ESTADOS.CANCELADO) {
    for (const item of pedido.items) {
      if (item.producto && item.producto.id) {
        const { data: prod } = await supabase
          .from('productos')
          .select('stock')
          .eq('id', item.producto.id)
          .maybeSingle();

        if (prod) {
          const previousStock = prod.stock;
          const nuevoStock = previousStock + item.cantidad;
          const cambios = { stock: nuevoStock };
          if (previousStock === 0 && nuevoStock > 0) {
            cambios.disponible = true;
            cambios.motivo_no_disponible = null;
          }
          await supabase.from('productos').update(cambios).eq('id', item.producto.id);
        }
      }
    }
  }

  const { error } = await supabase
    .from('pedidos')
    .update({ estado: nuevoEstado })
    .eq('id', id);

  if (error) throw new Error(error.message);

  // Acreditar puntos y registrar sándwich si se entrega (RECOGIDO)
  if (nuevoEstado === ESTADOS.RECOGIDO && pedido.estado !== ESTADOS.RECOGIDO) {
    const fidelidadService = require('./fidelidadService');
    await fidelidadService.acreditarPuntos(pedido.estudianteId, pedido.total);

    let sandwichesQty = 0;
    for (const item of pedido.items) {
      if (
        item.producto &&
        item.producto.categoria &&
        item.producto.categoria.toLowerCase() === 'sandwich'
      ) {
        sandwichesQty += item.cantidad;
      }
    }
    if (sandwichesQty > 0) {
      await fidelidadService.registrarSandwich(pedido.estudianteId, sandwichesQty);
    }
  }

  pedido.estado = nuevoEstado;
  return pedido;
}

/**
 * Lista todos los pedidos registrados.
 * @returns {Promise<Object[]>}
 */
async function listarPedidos() {
  const { data: pedidos, error: errPed } = await supabase
    .from('pedidos')
    .select('*')
    .order('creado_en', { ascending: false });

  if (errPed) throw new Error(errPed.message);

  const result = [];
  for (const pedido of pedidos) {
    const { data: items, error: errItems } = await supabase
      .from('items_pedido')
      .select('*, productos(*)')
      .eq('pedido_id', pedido.id);

    if (errItems) throw new Error(errItems.message);

    result.push({
      id: pedido.id,
      estudianteId: pedido.estudiante_id,
      estado: pedido.estado,
      total: pedido.total,
      creadoEn: pedido.creado_en,
      items: items.map((it) => ({
        cantidad: it.cantidad,
        precioUnitario: it.precio_unitario,
        producto: it.productos,
        subtotal: it.precio_unitario * it.cantidad,
      })),
    });
  }
  return result;
}

module.exports = {
  calcularSubtotal,
  calcularTotalPedido,
  validarDisponibilidadPedido,
  crearPedido,
  confirmarPedido,
  obtenerPedido,
  cambiarEstado,
  listarPedidos,
};
