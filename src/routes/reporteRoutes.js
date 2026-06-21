const express = require('express');
const router = express.Router();
const reporteService = require('../services/reporteService');

router.get('/', (_req, res) => {
  res.json({
    masVendidos:  reporteService.productosMasVendidos(),
    estadisticas: reporteService.estadisticasGenerales(),
  });
});

module.exports = router;
