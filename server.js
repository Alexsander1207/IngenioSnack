/**
 * server.js — Servidor web IngenioSnack
 * Express API + SPA para el sistema de pedidos anticipados.
 * Roles: Estudiante (HU-01..07) | Vendedor — Sr. Julio (HU-05,06,08,09)
 *
 * Ejecutar: node server.js   (o:  npm run web)
 */
const express  = require('express');
const path     = require('path');

const menuService      = require('./src/services/menuService');
const pedidoService    = require('./src/services/pedidoService');
const fidelidadService = require('./src/services/fidelidadService');
const reporteService   = require('./src/services/reporteService');
const Estudiante       = require('./src/models/Estudiante');
const { ESTADOS }      = require('./src/models/Pedido');
const { db }           = require('./src/data/memoria');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── SERIALIZACION ──────────────────────────────────────────────
// Los getters de clase (total, subtotal) no los incluye JSON.stringify,
// por eso los computamos explicitamente antes de enviar.
function serItem(item) {
  return {
    producto: item.producto,
    cantidad: item.cantidad,
    subtotal: item.subtotal,
  };
}

function serPedido(p) {
  const est = db.estudiantes.find(e => e.id === p.estudianteId);
  return {
    id:               p.id,
    estudianteId:     p.estudianteId,
    nombreEstudiante: est ? est.nombre : 'Desconocido',
    items:            p.items.map(serItem),
    estado:           p.estado,
    fecha:            p.fecha,
    total:            p.total,
  };
}

// ─── DATOS INICIALES (SEED) ──────────────────────────────────────
function seedData() {
  // Productos del menu (9 items, 3 categorias)
  menuService.registrarProducto({ id: 'S1', nombre: 'Sandwich de pollo',  precio: 5.00, categoria: 'Sandwich' });
  menuService.registrarProducto({ id: 'S2', nombre: 'Triple',              precio: 6.00, categoria: 'Sandwich' });
  menuService.registrarProducto({ id: 'S3', nombre: 'Sandwich de atun',    precio: 4.50, categoria: 'Sandwich' });
  menuService.registrarProducto({ id: 'B1', nombre: 'Cafe americano',      precio: 3.00, categoria: 'Bebida'   });
  menuService.registrarProducto({ id: 'B2', nombre: 'Jugo de naranja',     precio: 4.00, categoria: 'Bebida'   });
  menuService.registrarProducto({ id: 'B3', nombre: 'Agua mineral',        precio: 1.50, categoria: 'Bebida'   });
  menuService.registrarProducto({ id: 'K1', nombre: 'Empanada de pollo',   precio: 4.00, categoria: 'Snack'    });
  menuService.registrarProducto({ id: 'K2', nombre: 'Galletas',            precio: 2.00, categoria: 'Snack'    });
  menuService.registrarProducto({ id: 'K3', nombre: 'Papa frita', precio: 2.50, categoria: 'Snack', disponible: false });

  // Estudiantes de prueba
  db.estudiantes.push(
    new Estudiante({ id: 'E1', nombre: 'Ana Quispe',    codigo: '2021100123', correo: 'ana.quispe@uncp.edu.pe',    puntos: 15, sandwiches: 3 }),
    new Estudiante({ id: 'E2', nombre: 'Carlos Rios',   codigo: '2022200456', correo: 'carlos.rios@uncp.edu.pe',   puntos: 8,  sandwiches: 7 }),
  );

  // Pedidos de ejemplo en distintos estados
  try {
    const p1 = pedidoService.crearPedido('E1', [{ productoId: 'S1', cantidad: 2 }, { productoId: 'B1', cantidad: 1 }]);
    pedidoService.confirmarPedido(p1.id);
    pedidoService.cambiarEstado(p1.id, ESTADOS.EN_PREPARACION);

    const p2 = pedidoService.crearPedido('E2', [{ productoId: 'S2', cantidad: 1 }, { productoId: 'B2', cantidad: 1 }]);
    pedidoService.confirmarPedido(p2.id);

    pedidoService.crearPedido('E1', [{ productoId: 'K1', cantidad: 2 }]);
  } catch (err) {
    console.error('Seed error:', err.message);
  }
}

seedData();

// ═══════════════════════════════════════════════════════════════
//  AUTH
// ═══════════════════════════════════════════════════════════════

// HU-01 — Identificacion del estudiante por codigo o correo
app.post('/api/auth/estudiante', (req, res) => {
  const { codigo, correo, nombre } = req.body;
  if (!codigo && !correo)
    return res.status(400).json({ error: 'Se requiere codigo universitario o correo institucional.' });

  let est = db.estudiantes.find(e =>
    (codigo && e.codigo === codigo) ||
    (correo && e.correo  === correo.toLowerCase())
  );

  if (!est) {
    if (!nombre || nombre.trim() === '') {
      return res.status(404).json({
        error:   'Estudiante no encontrado. Ingresa tu nombre para registrarte.',
        registro: true,
      });
    }
    const id = 'E' + Date.now();
    est = new Estudiante({
      id,
      nombre: nombre.trim(),
      codigo: codigo  || null,
      correo: correo  ? correo.toLowerCase() : null,
    });
    db.estudiantes.push(est);
  }

  res.json({ ok: true, estudiante: { id: est.id, nombre: est.nombre, codigo: est.codigo, correo: est.correo } });
});

// Admin — PIN 1234
app.post('/api/auth/admin', (req, res) => {
  const { pin } = req.body;
  if (pin !== '1234') return res.status(401).json({ error: 'PIN incorrecto.' });
  res.json({ ok: true, admin: { nombre: 'Sr. Julio', rol: 'vendedor' } });
});

// ═══════════════════════════════════════════════════════════════
//  PRODUCTOS  (HU-02, HU-05)
// ═══════════════════════════════════════════════════════════════

app.get('/api/productos', (_req, res) => {
  res.json(menuService.listarProductos());
});

app.post('/api/productos', (req, res) => {
  const { nombre, precio, categoria } = req.body;
  if (!nombre || precio == null || !categoria)
    return res.status(400).json({ error: 'nombre, precio y categoria son requeridos.' });
  const p = menuService.registrarProducto({
    nombre:    nombre.trim(),
    precio:    parseFloat(precio),
    categoria,
  });
  res.status(201).json(p);
});

// HU-05 — Gestion rapida de disponibilidad
app.put('/api/productos/:id', (req, res) => {
  const { disponible } = req.body;
  if (typeof disponible !== 'boolean')
    return res.status(400).json({ error: 'disponible debe ser true o false.' });
  const producto = menuService.cambiarDisponibilidadProducto(req.params.id, disponible);
  if (!producto) return res.status(404).json({ error: 'Producto no encontrado.' });
  res.json(producto);
});

// ═══════════════════════════════════════════════════════════════
//  PEDIDOS  (HU-03, HU-04, HU-06, HU-09)
// ═══════════════════════════════════════════════════════════════

// HU-09 — Lista de pedidos (para Sr. Julio)
app.get('/api/pedidos', (_req, res) => {
  res.json(db.pedidos.map(serPedido));
});

// HU-03 — Crear pedido anticipado
app.post('/api/pedidos', (req, res) => {
  const { estudianteId, lineas } = req.body;
  if (!estudianteId || !Array.isArray(lineas))
    return res.status(400).json({ error: 'estudianteId y lineas[] son requeridos.' });
  try {
    const pedido = pedidoService.crearPedido(estudianteId, lineas);
    res.status(201).json(serPedido(pedido));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// HU-04 — Confirmar con validacion de disponibilidad
app.post('/api/pedidos/:id/confirmar', (req, res) => {
  try {
    const pedido = pedidoService.confirmarPedido(req.params.id);
    res.json(serPedido(pedido));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// HU-06 — Cambiar estado; al ENTREGADO se acreditan puntos y sandwiches
app.put('/api/pedidos/:id/estado', (req, res) => {
  const { estado } = req.body;
  if (!estado) return res.status(400).json({ error: 'estado es requerido.' });
  try {
    const pedido = pedidoService.cambiarEstado(req.params.id, estado);

    if (estado === ESTADOS.ENTREGADO) {
      const est = db.estudiantes.find(e => e.id === pedido.estudianteId);
      if (est) {
        fidelidadService.acreditarPuntos(est.id, pedido.total);
        const sws = pedido.items
          .filter(i => i.producto.categoria === 'Sandwich')
          .reduce((s, i) => s + i.cantidad, 0);
        if (sws > 0) fidelidadService.registrarSandwich(est.id, sws);
      }
    }

    res.json(serPedido(pedido));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════
//  ESTUDIANTE  (HU-07)
// ═══════════════════════════════════════════════════════════════

app.get('/api/estudiante/:id', (req, res) => {
  const est = db.estudiantes.find(e => e.id === req.params.id);
  if (!est) return res.status(404).json({ error: 'Estudiante no encontrado.' });
  const pedidos    = db.pedidos.filter(p => p.estudianteId === req.params.id).map(serPedido);
  const beneficios = fidelidadService.obtenerBeneficios(req.params.id);
  res.json({ id: est.id, nombre: est.nombre, codigo: est.codigo, correo: est.correo, pedidos, beneficios });
});

// HU-07 — Canjear cafe gratis (10 sandwiches acumulados)
app.post('/api/estudiante/:id/canjear-cafe', (req, res) => {
  try {
    const result = fidelidadService.canjearCafeGratis(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════
//  REPORTE  (HU-08)
// ═══════════════════════════════════════════════════════════════

app.get('/api/reporte', (_req, res) => {
  res.json({
    masVendidos:  reporteService.productosMasVendidos(),
    estadisticas: reporteService.estadisticasGenerales(),
  });
});

// ─── ARRANCAR ───────────────────────────────────────────────────
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`\n  ☕  IngenioSnack corriendo en http://localhost:${PORT}`);
  console.log(`  🎓  Estudiante de prueba — codigo: 2021100123`);
  console.log(`  🏪  Vendedor — PIN: 1234\n`);
});
