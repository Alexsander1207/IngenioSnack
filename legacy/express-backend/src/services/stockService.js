const { supabase } = require('../config/supabaseClient');
const fs = require('fs');
const path = require('path');

const localFile = path.join(process.cwd(), 'movimientos_stock.json');

function readLocal() {
  if (!fs.existsSync(localFile)) return [];
  try {
    return JSON.parse(fs.readFileSync(localFile, 'utf8'));
  } catch (e) {
    return [];
  }
}

function writeLocal(data) {
  fs.writeFileSync(localFile, JSON.stringify(data, null, 2));
}

async function registrarMovimiento({ productoId, productoNombre, categoria, tipo, cantidad, motivo }) {
  const mov = {
    producto_id: productoId,
    producto_nombre: productoNombre,
    categoria: categoria || 'General',
    tipo, // 'INGRESO' | 'SALIDA'
    cantidad,
    motivo, // 'REPOSICION' | 'VENTA' | 'CANCELACION' | 'AJUSTE'
    creado_en: new Date().toISOString()
  };

  try {
    // Intentar guardar en Supabase (si existe la tabla)
    const { error } = await supabase.from('movimientos_stock').insert([mov]);
    if (error) throw error;
  } catch (err) {
    // Guardar en local JSON como fallback
    const list = readLocal();
    list.unshift({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      ...mov
    });
    writeLocal(list);
  }
}

async function listarMovimientos() {
  try {
    const { data, error } = await supabase
      .from('movimientos_stock')
      .select('*')
      .order('creado_en', { ascending: false });
    if (error) throw error;
    return data.map(d => ({
      id: d.id,
      productoId: d.producto_id,
      productoNombre: d.producto_nombre,
      categoria: d.categoria,
      tipo: d.tipo,
      cantidad: d.cantidad,
      motivo: d.motivo,
      creadoEn: d.creado_en
    }));
  } catch (err) {
    const local = readLocal();
    return local.map(d => ({
      id: d.id,
      productoId: d.producto_id,
      productoNombre: d.producto_nombre,
      categoria: d.categoria,
      tipo: d.tipo,
      cantidad: d.cantidad,
      motivo: d.motivo,
      creadoEn: d.creado_en
    }));
  }
}

module.exports = {
  registrarMovimiento,
  listarMovimientos
};
