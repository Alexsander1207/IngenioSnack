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

async function serPedido(p) {
  const est = await estudianteService.obtenerEstudiantePorId(p.estudianteId);
  return {
    id:               p.id,
    estudianteId:     p.estudianteId,
    nombreEstudiante: est ? est.nombre : 'Desconocido',
    items:            p.items.map(serItem),
    estado:           p.estado,
    fecha:            p.fecha || p.creadoEn,
    total:            p.total,
  };
}

// GET /api/pedidos
router.get('/', async (_req, res) => {
  try {
    const pedidos = await pedidoService.listarPedidos();
    const serialized = await Promise.all(pedidos.map(serPedido));
    res.json(serialized);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/pedidos
router.post('/', async (req, res) => {
  const { estudianteId, lineas } = req.body;
  if (!estudianteId || !Array.isArray(lineas)) {
    return res.status(400).json({ error: 'estudianteId y lineas[] son requeridos.' });
  }
  
  // Validar disponibilidad en el instante exacto de la confirmacion (HU-03)
  // Nota: db.productos en memoria ya no se usa con supabase, pero mantengamos compatibilidad si es necesario, o consultamos directamente de supabase si es preciso.
  // Sin embargo, pedidoService.crearPedido ya realiza todas las validaciones necesarias con la DB.
  
  try {
    const pedido = await pedidoService.crearPedido(estudianteId, lineas);
    res.status(201).json(await serPedido(pedido));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/pedidos/:id/confirmar
router.post('/:id/confirmar', async (req, res) => {
  try {
    const pedido = await pedidoService.confirmarPedido(req.params.id);
    res.json(await serPedido(pedido));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/pedidos/:id/estado
router.put('/:id/estado', async (req, res) => {
  const { estado } = req.body;
  if (!estado) return res.status(400).json({ error: 'estado es requerido.' });
  
  const estadosValidos = ['PENDIENTE', 'CONFIRMADO', 'EN_PREPARACION', 'LISTO', 'RECOGIDO', 'CANCELADO'];
  if (!estadosValidos.includes(estado)) {
    return res.status(400).json({ error: `Estado inválido. Válidos: ${estadosValidos.join(', ')}` });
  }
  
  try {
    const pedido = await pedidoService.cambiarEstado(req.params.id, estado);

    // Al RECOGIDO (pago en mano) se acreditan puntos y sellos de sandwich
    if (estado === ESTADOS.RECOGIDO) {
      const est = await estudianteService.obtenerEstudiantePorId(pedido.estudianteId);
      if (est) {
        await fidelidadService.acreditarPuntos(est.id, pedido.total);
        const sws = pedido.items
          .filter(i => i.producto && i.producto.categoria === 'Sandwich')
          .reduce((s, i) => s + i.cantidad, 0);
        if (sws > 0) await fidelidadService.registrarSandwich(est.id, sws);

        // Actualizar progreso para todas las reglas de fidelidad dinámicas
        for (const item of pedido.items) {
          if (item.producto && item.producto.id) {
            await fidelidadService.actualizarProgresoCompra(est.id, item.producto.id, item.cantidad);
          }
        }
      }
    }

    res.json(await serPedido(pedido));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/pedidos/:id
router.get('/:id', async (req, res) => {
  try {
    const pedido = await pedidoService.obtenerPedido(req.params.id);
    if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado.' });
    res.json(await serPedido(pedido));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
module.exports.serPedido = serPedido;
