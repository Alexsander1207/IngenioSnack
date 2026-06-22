const express = require('express');
const router = express.Router();
const fidelidadService = require('../services/fidelidadService');

/**
 * GET /api/fidelidad/ranking
 * Retorna el ranking de estudiantes más fieles.
 */
router.get('/ranking', async (req, res) => {
  try {
    const limite = req.query.limite ? parseInt(req.query.limite) : 10;
    const ranking = await fidelidadService.obtenerRankingClientes(limite);
    res.status(200).json(ranking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/fidelidad/reglas
 * Lista todas las reglas configuradas y activas.
 */
router.get('/reglas', async (req, res) => {
  try {
    const reglas = await fidelidadService.listarReglasFidelidad();
    res.status(200).json(reglas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/fidelidad/reglas
 * Crea una nueva regla de fidelidad dinámica.
 */
router.post('/reglas', async (req, res) => {
  try {
    const { nombre, productoCriterioId, cantidadCriterio, productoPremioId } = req.body;
    
    // Validación básica de campos
    if (!nombre || !productoCriterioId || !cantidadCriterio || !productoPremioId) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
    }

    const nuevaRegla = await fidelidadService.crearReglaFidelidad({
      nombre,
      productoCriterioId,
      cantidadCriterio,
      productoPremioId
    });

    res.status(201).json(nuevaRegla);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/fidelidad/estudiante/:id/canjear-premio
 * Canjea un premio acumulado (puedes adaptar esto a tus tablas de progreso si lo necesitas).
 */
router.post('/estudiante/:id/canjear-premio', async (req, res) => {
  try {
    const estudianteId = req.params.id;
    const { puntos } = req.body; // O la lógica de la tabla progreso_fidelidad

    const puntosRestantes = await fidelidadService.canjearPuntos(estudianteId, puntos);
    res.status(200).json({ message: 'Canje exitoso', puntosRestantes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
