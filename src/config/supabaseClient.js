/**
 * supabaseClient
 * Crea y exporta el cliente de Supabase para IngenioSnack.
 * Las credenciales se leen de variables de entorno (.env).
 *
 * En las pruebas unitarias este modulo se reemplaza con jest.mock,
 * por lo que no se realizan llamadas reales a la red.
 */
const { createClient } = require('@supabase/supabase-js');

// Carga el .env si existe (no falla si dotenv no esta presente).
try {
  require('dotenv').config();
} catch (_) {
  /* dotenv es opcional en algunos entornos */
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;

/**
 * Crea un cliente de Supabase. Lanza un error claro si faltan credenciales.
 * @returns {import('@supabase/supabase-js').SupabaseClient}
 */
function crearCliente() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error(
      'Faltan credenciales de Supabase. Define SUPABASE_URL y SUPABASE_ANON_KEY en tu archivo .env (ver .env.example).'
    );
  }
  return createClient(SUPABASE_URL, SUPABASE_KEY);
}

// Cliente listo para usar; es null si aun no hay credenciales configuradas.
const supabase = SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

module.exports = { supabase, crearCliente };
