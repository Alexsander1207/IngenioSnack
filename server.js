/**
 * server.js — Servidor web IngenioSnack
 * Express API + SPA para el sistema de pedidos anticipados.
 * Roles: Estudiante (HU-01..07) | Vendedor — Sr. Julio (HU-05,06,08,09)
 *
 * Ejecutar: node server.js   (o:  npm run web)
 */
const express = require('express');
const path = require('path');

// Servicios y Modelos para Seed Data
const menuService = require('./src/services/menuService');
const pedidoService = require('./src/services/pedidoService');
const estudianteService = require('./src/services/estudianteService');
const Estudiante = require('./src/models/Estudiante');
const { ESTADOS } = require('./src/models/Pedido');
const { db } = require('./src/data/memoria');

// Rutas modulares
const authRoutes = require('./src/routes/authRoutes');
const productoRoutes = require('./src/routes/productoRoutes');
const pedidoRoutes = require('./src/routes/pedidoRoutes');
const estudianteRoutes = require('./src/routes/estudianteRoutes');
const reporteRoutes = require('./src/routes/reporteRoutes');

const app = express();
app.use(express.json());

// ─── DATOS INICIALES (SEED) ──────────────────────────────────────
function seedData() {
  // Productos del menu (9 items, 3 categorias)
  menuService.registrarProducto({ id: 'S1', nombre: 'Sandwich de pollo',  precio: 5.00, categoria: 'Sandwich' });
  menuService.registrarProducto({ id: 'S2', nombre: 'Triple',              precio: 6.00, categoria: 'Sandwich' });
  menuService.registrarProducto({ id: 'S3', nombre: 'Sandwich de atun',    precio: 4.50, categoria: 'Sandwich' });
  menuService.registrarProducto({ id: 'B1', nombre: 'Cafe americano',      precio: 3.00, categoria: 'Bebida'   });
  menuService.registrarProducto({ id: 'B2', nombre: 'Jugo de naranja',     precio: 4.00, categoria: 'Bebida'   });
  menuService.registrarProducto({ id: 'B3', nombre: 'Agua mineral',        precio: 1.50, categoria: 'Bebida'   });
  menuService.registrarProducto({ id: 'K1', nombre: 'Empanada de pollo',   precio: 4.00, categoria: 'Snack'    });
  menuService.registrarProducto({ id: 'K2', nombre: 'Galletas',            precio: 2.00, categoria: 'Snack'    });
  menuService.registrarProducto({ id: 'K3', nombre: 'Papa frita', precio: 2.50, categoria: 'Snack', disponible: false });

  // Estudiantes de prueba
  db.estudiantes.push(
    new Estudiante({ id: 'E1', nombre: 'Ana Quispe',    codigo: '2021100123', correo: 'ana.quispe@uncp.edu.pe',    puntos: 15, sandwiches: 3, password: estudianteService.hashPassword('12345678') }),
    new Estudiante({ id: 'E2', nombre: 'Carlos Rios',   codigo: '2022200456', correo: 'carlos.rios@uncp.edu.pe',   puntos: 8,  sandwiches: 7, password: estudianteService.hashPassword('12345678') }),
  );

  // Pedidos de ejemplo en distintos estados
  try {
    const p1 = pedidoService.crearPedido('E1', [{ productoId: 'S1', cantidad: 2 }, { productoId: 'B1', cantidad: 1 }]);
    pedidoService.confirmarPedido(p1.id);
    pedidoService.cambiarEstado(p1.id, ESTADOS.EN_PREPARACION);

    const p2 = pedidoService.crearPedido('E2', [{ productoId: 'S2', cantidad: 1 }, { productoId: 'B2', cantidad: 1 }]);
    pedidoService.confirmarPedido(p2.id);

    pedidoService.crearPedido('E1', [{ productoId: 'K1', cantidad: 2 }]);
  } catch (err) {
    console.error('Seed error:', err.message);
  }
}

seedData();

// ─── MONTAR RUTAS API ────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/productos', productoRoutes);
app.use('/api/pedidos', pedidoRoutes);
app.use('/api/estudiante', estudianteRoutes);
app.use('/api/reporte', reporteRoutes);

// Servir SPA después de todas las rutas API
app.use(express.static(path.join(__dirname, 'public')));

// SPA fallback route for React Router client-side routing on page refresh
app.get('*splat', (req, res) => {
  if (req.path.startsWith('/api') || req.path.includes('.')) {
    return res.status(404).send('Not Found');
  }
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// ─── ARRANCAR ───────────────────────────────────────────────────
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`\n  ☕  IngenioSnack corriendo en http://localhost:${PORT}`);
  console.log(`  🎓  Estudiante de prueba — codigo: 2021100123`);
  console.log(`  🏪  Vendedor — PIN: 1234\n`);
});
