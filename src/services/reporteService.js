/**
 * reporteService — HU-08: productos mas vendidos y estadisticas generales.
 */
const { db } = require('../data/memoria');
const { ESTADOS } = require('../models/Pedido');

function productosMasVendidos() {
  const conteo = {};
  db.pedidos
    .filter(p => p.estado === ESTADOS.ENTREGADO)
    .forEach(pedido => {
      pedido.items.forEach(item => {
        const key = item.producto.id || item.producto.nombre;
        if (!conteo[key]) {
          conteo[key] = {
            nombre: item.producto.nombre,
            categoria: item.producto.categoria,
            precio: item.producto.precio,
            cantidad: 0,
            ingresos: 0,
          };
        }
        conteo[key].cantidad += item.cantidad;
        conteo[key].ingresos += item.subtotal;
      });
    });
  return Object.values(conteo).sort((a, b) => b.cantidad - a.cantidad);
}

function estadisticasGenerales() {
  const pedidos = db.pedidos;
  const entregados = pedidos.filter(p => p.estado === ESTADOS.ENTREGADO);
  const activos = pedidos.filter(p => ![ESTADOS.ENTREGADO, ESTADOS.CANCELADO].includes(p.estado));
  return {
    totalPedidos: pedidos.length,
    pedidosEntregados: entregados.length,
    pedidosActivos: activos.length,
    ingresosTotales: entregados.reduce((s, p) => s + p.total, 0),
    estudiantesRegistrados: db.estudiantes.length,
    productosDisponibles: db.productos.filter(p => p.disponible).length,
    totalProductos: db.productos.length,
  };
}

module.exports = { productosMasVendidos, estadisticasGenerales };
