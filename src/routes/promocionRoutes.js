/**
 * promocionRoutes
 * Endpoints REST para la gestión de promociones/combos.
 *
 * GET    /api/promociones       — Listar promociones activas
 * POST   /api/promociones       — Crear un combo
 * PUT    /api/promociones/:id   — Cambiar disponibilidad
 * DELETE /api/promociones/:id   — Baja lógica (desactivar)
 */
const express = require('express');
const router = express.Router();
const promocionService = require('../services/promocionService');

// GET /api/promociones — Listar promociones activas con sus productos
router.get('/', async (_req, res) => {
  try {
    const promociones = await promocionService.listarPromociones();
    res.json(promociones);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/promociones — Crear un nuevo combo/promoción
router.post('/', async (req, res) => {
  try {
    const { nombre, descripcion, precio, productos } = req.body;

    if (!nombre || precio == null || !Array.isArray(productos) || productos.length === 0) {
      return res.status(400).json({
        error: 'nombre, precio y productos[] son requeridos.',
      });
    }

    const promo = await promocionService.crearPromocion({
      nombre,
      descripcion: descripcion || null,
      precio: parseFloat(precio),
      productos,
    });

    res.status(201).json(promo);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/promociones/:id — Cambiar disponibilidad de la promoción
router.put('/:id', async (req, res) => {
  try {
    const { disponible } = req.body;

    if (typeof disponible !== 'boolean') {
      return res.status(400).json({ error: 'disponible debe ser true o false.' });
    }

    const promo = await promocionService.cambiarDisponibilidadPromocion(
      req.params.id,
      disponible
    );
    res.json(promo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/promociones/:id — Baja lógica (desactiva la promoción)
router.delete('/:id', async (req, res) => {
  try {
    const promo = await promocionService.desactivarPromocion(req.params.id);
    res.json({ message: 'Promoción desactivada.', promo });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
