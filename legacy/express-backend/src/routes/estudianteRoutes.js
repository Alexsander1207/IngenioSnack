const express = require('express');
const router = express.Router();
const estudianteService = require('../services/estudianteService');
const fidelidadService = require('../services/fidelidadService');
const pedidoService = require('../services/pedidoService');
const { serPedido } = require('./pedidoRoutes');

// GET /api/estudiante/:id
router.get('/:id', async (req, res) => {
  try {
    const est = await estudianteService.obtenerEstudiantePorId(req.params.id);
    if (!est) return res.status(404).json({ error: 'Estudiante no encontrado.' });
    
    // Filtrar pedidos del estudiante y serializarlos
    const allPedidos = await pedidoService.listarPedidos();
    const filteredPedidos = allPedidos.filter(p => p.estudianteId === req.params.id);
    const pedidos = await Promise.all(filteredPedidos.map(serPedido));
      
    const beneficios = await fidelidadService.obtenerBeneficios(req.params.id);
    res.json({
      id: est.id,
      nombre: est.nombre,
      codigo: est.codigo,
      correo: est.correo,
      pedidos,
      beneficios
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// HU-07 — Canjear cafe gratis (10 sandwiches acumulados)
router.post('/:id/canjear-cafe', async (req, res) => {
  try {
    const result = await fidelidadService.canjearCafeGratis(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
