const express = require('express');
const router = express.Router();
const productoService = require('../services/productoService');
const upload = require('../config/multer');

router.get('/', async (_req, res) => {
  try {
    const productos = await productoService.listarProductos();
    res.json(productos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', upload.single('imagen'), async (req, res) => {
  try {
    const { nombre, precio, categoria, stock } = req.body;
    if (!nombre || precio == null || !categoria) {
      return res.status(400).json({ error: 'nombre, precio y categoria son requeridos.' });
    }
      
    let imagenUrl = null;
    if (req.file) {
      imagenUrl = '/uploads/' + req.file.filename;
    }
    
    const parsedStock = stock != null ? parseInt(stock, 10) : 15;
    
    const p = await productoService.crearProducto({
      nombre: nombre.trim(),
      precio: parseFloat(precio),
      categoria,
      imagen_url: imagenUrl,
      stock: isNaN(parsedStock) ? 15 : parsedStock
    });
    res.status(201).json(p);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { disponible, razon, stock } = req.body;
    const producto = await productoService.obtenerProducto(req.params.id);
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado.' });
    
    const cambios = {};

    if (stock != null) {
      const parsedStock = parseInt(stock, 10);
      if (isNaN(parsedStock) || parsedStock < 0) {
        return res.status(400).json({ error: 'stock debe ser un número entero mayor o igual a 0.' });
      }
      cambios.stock = parsedStock;
      if (parsedStock > 0) {
        cambios.disponible = true;
        cambios.motivo_no_disponible = null;
      } else {
        cambios.disponible = false;
        cambios.motivo_no_disponible = 'Agotado';
      }
    }

    if (disponible != null) {
      if (typeof disponible !== 'boolean') {
        return res.status(400).json({ error: 'disponible debe ser true o false.' });
      }
      
      cambios.disponible = disponible;
      if (!disponible) {
        cambios.stock = 0;
        if (razon) cambios.motivo_no_disponible = razon;
      } else {
        if (producto.stock === 0) {
          cambios.stock = 15; // Reposición por defecto
        }
        cambios.motivo_no_disponible = null;
      }
    }

    const actualizado = await productoService.actualizarProducto(req.params.id, cambios);
    res.json(actualizado);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
