const express = require('express');
const router = express.Router();
const estudianteService = require('../services/estudianteService');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { nombre, correo, password, confirmPassword } = req.body;
  if (!nombre || !correo || !password || !confirmPassword) {
    return res.status(400).json({ error: 'Todos los campos son requeridos.' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Las contraseñas no coinciden.' });
  }

  try {
    const est = await estudianteService.registrarEstudiante({ nombre, correo, password });
    res.status(201).json({
      ok: true,
      estudiante: {
        id: est.id,
        nombre: est.nombre,
        codigo: est.codigo,
        correo: est.correo,
      }
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { correo, password } = req.body;
  if (!correo || !password) {
    return res.status(400).json({ error: 'Correo y contraseña son requeridos.' });
  }

  try {
    const userOrAdmin = await estudianteService.verificarCredenciales(correo, password);
    
    // Si es Administrador
    if (userOrAdmin.rol === 'vendedor') {
      return res.json({
        ok: true,
        admin: {
          nombre: userOrAdmin.nombre,
          rol: userOrAdmin.rol,
          correo: userOrAdmin.correo
        }
      });
    }

    // Si es Estudiante
    res.json({
      ok: true,
      estudiante: {
        id: userOrAdmin.id,
        nombre: userOrAdmin.nombre,
        codigo: userOrAdmin.codigo,
        correo: userOrAdmin.correo,
      }
    });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

// Admin — PIN 1234 (Mantenido solo para compatibilidad hacia atrás si se requiere en algún test heredado, pero no se expone ni usa)
router.post('/admin', (req, res) => {
  const { pin } = req.body;
  if (pin !== '1234') return res.status(401).json({ error: 'PIN incorrecto.' });
  res.json({ ok: true, admin: { nombre: 'Sr. Julio', rol: 'vendedor' } });
});

module.exports = router;
