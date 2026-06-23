const express = require('express');
const router = express.Router();
const reporteService = require('../services/reporteService');

router.get('/', async (_req, res) => {
  try {
    const [masVendidos, estadisticas] = await Promise.all([
      reporteService.productosMasVendidos(),
      reporteService.estadisticasGenerales()
    ]);
    res.json({
      masVendidos,
      estadisticas
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
