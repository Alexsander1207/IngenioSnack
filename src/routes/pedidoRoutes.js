const express = require('express');
const router = express.Router();
const pedidoService = require('../services/pedidoService');
const fidelidadService = require('../services/fidelidadService');
const estudianteService = require('../services/estudianteService');
const { db } = require('../data/memoria');
const { ESTADOS } = require('../models/Pedido');

function serItem(item) {
  return {
    producto: item.producto,
    cantidad: item.cantidad,
    subtotal: item.subtotal,
  };
}

function serPedido(p) {
  const est = estudianteService.obtenerEstudiantePorId(p.estudianteId);
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

// GET /api/pedidos
router.get('/', (_req, res) => {
  res.json(pedidoService.listarPedidos().map(serPedido));
});

// POST /api/pedidos
router.post('/', (req, res) => {
  const { estudianteId, lineas } = req.body;
  if (!estudianteId || !Array.isArray(lineas)) {
    return res.status(400).json({ error: 'estudianteId y lineas[] son requeridos.' });
  }
  
  // Validar disponibilidad en el instante exacto de la confirmacion (HU-03)
  const agotados = lineas.filter(l => {
    const p = db.productos.find(pr => pr.id === l.productoId);
    return p && !p.disponible;
  }).map(l => db.productos.find(pr => pr.id === l.productoId).nombre);
  
  if (agotados.length > 0) {
    return res.status(400).json({
      error: `Los siguientes productos ya no están disponibles: ${agotados.join(', ')}. Por favor actualiza tu carrito.`
    });
  }
  
  try {
    const pedido = pedidoService.crearPedido(estudianteId, lineas);
    res.status(201).json(serPedido(pedido));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/pedidos/:id/confirmar
router.post('/:id/confirmar', (req, res) => {
  try {
    const pedido = pedidoService.confirmarPedido(req.params.id);
    res.json(serPedido(pedido));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/pedidos/:id/estado
router.put('/:id/estado', (req, res) => {
  const { estado } = req.body;
  if (!estado) return res.status(400).json({ error: 'estado es requerido.' });
  
  const estadosValidos = ['PENDIENTE', 'CONFIRMADO', 'EN_PREPARACION', 'LISTO', 'RECOGIDO', 'CANCELADO'];
  if (!estadosValidos.includes(estado)) {
    return res.status(400).json({ error: `Estado inválido. Válidos: ${estadosValidos.join(', ')}` });
  }
  
  try {
    const pedido = pedidoService.cambiarEstado(req.params.id, estado);

    // Al RECOGIDO (pago en mano) se acreditan puntos y sellos de sandwich
    if (estado === ESTADOS.RECOGIDO) {
      const est = estudianteService.obtenerEstudiantePorId(pedido.estudianteId);
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

// GET /api/pedidos/:id
router.get('/:id', (req, res) => {
  const pedido = pedidoService.obtenerPedido(req.params.id);
  if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado.' });
  res.json(serPedido(pedido));
});

module.exports = router;
module.exports.serPedido = serPedido;
