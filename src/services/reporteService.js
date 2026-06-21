/**
 * reporteService — HU-08: productos mas vendidos y estadisticas generales.
 */
const { supabase } = require('../config/supabaseClient');
const { ESTADOS } = require('../models/Pedido');

async function productosMasVendidos() {
  const { data: items, error } = await supabase
    .from('items_pedido')
    .select('*, pedidos!inner(estado), productos(*)')
    .eq('pedidos.estado', ESTADOS.RECOGIDO);

  if (error) throw new Error(error.message);

  const conteo = {};
  items.forEach(item => {
    const prod = item.productos;
    if (!prod) return;
    const key = prod.id;
    if (!conteo[key]) {
      conteo[key] = {
        nombre: prod.nombre,
        categoria: prod.categoria,
        precio: prod.precio,
        cantidad: 0,
        ingresos: 0,
      };
    }
    conteo[key].cantidad += item.cantidad;
    conteo[key].ingresos += item.precio_unitario * item.cantidad;
  });

  return Object.values(conteo).sort((a, b) => b.cantidad - a.cantidad);
}

async function estadisticasGenerales() {
  const { data: pedidos, error: errPed } = await supabase.from('pedidos').select('estado, total');
  if (errPed) throw new Error(errPed.message);

  const entregados = pedidos.filter(p => p.estado === ESTADOS.RECOGIDO);
  const activos = pedidos.filter(p => ![ESTADOS.RECOGIDO, ESTADOS.CANCELADO].includes(p.estado));

  const { count: totalEstudiantes, error: errEst } = await supabase
    .from('estudiantes')
    .select('*', { count: 'exact', head: true });
  if (errEst) throw new Error(errEst.message);

  const { data: productos, error: errProd } = await supabase
    .from('productos')
    .select('disponible, activo');
  if (errProd) throw new Error(errProd.message);

  const productosActivos = productos.filter(p => p.activo);
  const productosDisponibles = productosActivos.filter(p => p.disponible);

  return {
    totalPedidos: pedidos.length,
    pedidosEntregados: entregados.length,
    pedidosActivos: activos.length,
    ingresosTotales: entregados.reduce((s, p) => s + Number(p.total), 0),
    estudiantesRegistrados: totalEstudiantes || 0,
    productosDisponibles: productosDisponibles.length,
    totalProductos: productosActivos.length,
  };
}

module.exports = { productosMasVendidos, estadisticasGenerales };
