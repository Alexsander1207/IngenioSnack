const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const productoService = require('../services/productoService');
const stockService = require('../services/stockService');
const upload = require('../config/multer');
const { supabase } = require('../config/supabaseClient');

router.get('/', async (req, res) => {
  try {
    const productos = await productoService.listarProductos(req.query.categoriaId);
    res.json(productos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/movimientos', async (req, res) => {
  try {
    const list = await stockService.listarMovimientos();
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', upload.single('imagen'), async (req, res) => {
  try {
    const { nombre, precio, categoria, stock, categoriaId } = req.body;
    if (!nombre || precio == null || !categoria) {
      return res.status(400).json({ error: 'nombre, precio y categoria son requeridos.' });
    }
      
    let imagenUrl = null;
    if (req.file) {
      const fileExt = path.extname(req.file.originalname) || '.jpg';
      const fileName = `${Date.now()}${fileExt}`;
      
      try {
        // Intentar subir a Supabase Storage
        let { data, error: uploadError } = await supabase.storage
          .from('productos')
          .upload(fileName, req.file.buffer, {
            contentType: req.file.mimetype,
            upsert: true
          });
          
        // Si el bucket no existe, intentamos crearlo y reintentar
        if (uploadError && uploadError.message && uploadError.message.includes('not found')) {
          console.log("Bucket 'productos' no encontrado, intentando crearlo...");
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

        if (uploadError) {
          throw uploadError;
        }

        // Obtener URL pública
        const { data: urlData } = supabase.storage
          .from('productos')
          .getPublicUrl(fileName);
        imagenUrl = urlData.publicUrl;
        console.log("Imagen subida exitosamente a Supabase Storage:", imagenUrl);
      } catch (storageError) {
        console.error("Fallo la subida a Supabase Storage, guardando en local:", storageError.message);
        
        // Fallback local en disco
        const localDir = path.join(process.cwd(), 'uploads');
        if (!fs.existsSync(localDir)) {
          fs.mkdirSync(localDir, { recursive: true });
        }
        
        const localFilePath = path.join(localDir, fileName);
        fs.writeFileSync(localFilePath, req.file.buffer);
        imagenUrl = '/uploads/' + fileName;
        console.log("Imagen guardada localmente como fallback:", imagenUrl);
      }
    }
    
    const parsedStock = stock != null ? parseInt(stock, 10) : 15;
    
    const p = await productoService.crearProducto({
      nombre: nombre.trim(),
      precio: parseFloat(precio),
      categoria,
      imagen_url: imagenUrl,
      stock: isNaN(parsedStock) ? 15 : parsedStock,
      categoriaId: categoriaId || null
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

router.delete('/:id', async (req, res) => {
  try {
    const producto = await productoService.obtenerProducto(req.params.id);
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado.' });
    
    await productoService.desactivarProducto(req.params.id);
    res.json({ success: true, message: 'Producto eliminado correctamente.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
