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

const path = require('path');
const fs = require('fs');
const upload = require('../config/multer');
const { supabase } = require('../config/supabaseClient');

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
router.post('/', upload.single('imagen'), async (req, res) => {
  try {
    let { nombre, descripcion, precio, productos } = req.body;

    if (!nombre || precio == null || !productos) {
      return res.status(400).json({
        error: 'nombre, precio y productos son requeridos.',
      });
    }

    // Si viene como string JSON (por FormData), lo parseamos
    if (typeof productos === 'string') {
      try {
        productos = JSON.parse(productos);
      } catch (e) {
        return res.status(400).json({ error: 'productos debe ser un JSON válido.' });
      }
    }

    if (!Array.isArray(productos) || productos.length === 0) {
      return res.status(400).json({
        error: 'productos debe ser una lista no vacía.',
      });
    }

    let imagenUrl = null;
    if (req.file) {
      const fileExt = path.extname(req.file.originalname) || '.jpg';
      const fileName = `${Date.now()}${fileExt}`;
      
      try {
        let { data, error: uploadError } = await supabase.storage
          .from('productos')
          .upload(fileName, req.file.buffer, {
            contentType: req.file.mimetype,
            upsert: true
          });
          
        if (uploadError && uploadError.message && uploadError.message.includes('not found')) {
          await supabase.storage.createBucket('productos', { public: true });
          const retry = await supabase.storage
            .from('productos')
            .upload(fileName, req.file.buffer, {
              contentType: req.file.mimetype,
              upsert: true
            });
          data = retry.data;
          uploadError = retry.error;
        }

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('productos')
          .getPublicUrl(fileName);
        imagenUrl = urlData.publicUrl;
      } catch (storageError) {
        console.error("Fallo la subida a Supabase, guardando local:", storageError.message);
        const localDir = path.join(process.cwd(), 'uploads');
        if (!fs.existsSync(localDir)) {
          fs.mkdirSync(localDir, { recursive: true });
        }
        const localFilePath = path.join(localDir, fileName);
        fs.writeFileSync(localFilePath, req.file.buffer);
        imagenUrl = '/uploads/' + fileName;
      }
    }

    const promo = await promocionService.crearPromocion({
      nombre,
      descripcion: descripcion || null,
      precio: parseFloat(precio),
      productos,
      imagen_url: imagenUrl
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
