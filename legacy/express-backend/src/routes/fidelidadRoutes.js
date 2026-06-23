const express = require('express');
const router = express.Router();
const fidelidadService = require('../services/fidelidadService');

// GET /api/fidelidad/ranking
router.get('/ranking', async (_req, res) => {
  try {
    const ranking = await fidelidadService.obtenerRankingClientes();
    res.json(ranking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/fidelidad/reglas
router.get('/reglas', async (_req, res) => {
  try {
    const reglas = await fidelidadService.listarReglasFidelidad();
    res.json(reglas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/fidelidad/reglas
router.post('/reglas', async (req, res) => {
  try {
    const { nombre, productoCriterioId, cantidadCriterio, productoPremioId } = req.body;
    const regla = await fidelidadService.crearReglaFidelidad({
      nombre,
      productoCriterioId,
      cantidadCriterio,
      productoPremioId
    });
    res.status(201).json(regla);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/fidelidad/canjear-premio
router.post('/canjear-premio', async (req, res) => {
  try {
    const { estudianteId, progresoId } = req.body;
    const result = await fidelidadService.canjearPremio(estudianteId, progresoId);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
