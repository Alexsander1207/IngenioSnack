const express = require('express');
const router = express.Router();
const estudianteService = require('../services/estudianteService');
const fidelidadService = require('../services/fidelidadService');
const pedidoService = require('../services/pedidoService');
const { serPedido } = require('./pedidoRoutes');

// GET /api/estudiante/:id
router.get('/:id', (req, res) => {
  const est = estudianteService.obtenerEstudiantePorId(req.params.id);
  if (!est) return res.status(404).json({ error: 'Estudiante no encontrado.' });
  
  // Filtrar pedidos del estudiante y serializarlos
  const pedidos = pedidoService.listarPedidos()
    .filter(p => p.estudianteId === req.params.id)
    .map(serPedido);
    
  const beneficios = fidelidadService.obtenerBeneficios(req.params.id);
  res.json({
    id: est.id,
    nombre: est.nombre,
    codigo: est.codigo,
    correo: est.correo,
    pedidos,
    beneficios
  });
});

// HU-07 — Canjear cafe gratis (10 sandwiches acumulados)
router.post('/:id/canjear-cafe', (req, res) => {
  try {
    const result = fidelidadService.canjearCafeGratis(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
