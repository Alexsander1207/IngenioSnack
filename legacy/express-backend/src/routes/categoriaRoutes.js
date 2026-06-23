const express = require('express');
const router = express.Router();
const categoriaService = require('../services/categoriaService');

// GET /api/categorias
router.get('/', async (_req, res) => {
  try {
    const categorias = await categoriaService.listarCategorias();
    res.json(categorias);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/categorias
router.post('/', async (req, res) => {
  try {
    const { nombre } = req.body;
    const cat = await categoriaService.crearCategoria(nombre);
    res.status(201).json(cat);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/categorias/:id
router.delete('/:id', async (req, res) => {
  try {
    await categoriaService.eliminarCategoria(req.params.id);
    res.json({ ok: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
