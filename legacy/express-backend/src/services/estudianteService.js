/**
 * estudianteService
 * Gestiona la lógica de negocio de los estudiantes y la autenticación unificada usando Supabase.
 */
const crypto = require('crypto');
const { supabase } = require('../config/supabaseClient');
const Estudiante = require('../models/Estudiante');

const TABLA = 'estudiantes';

/**
 * Hashea una contraseña usando SHA-256.
 * @param {string} password
 * @returns {string|null} Hash hexadecimal.
 */
function hashPassword(password) {
  if (!password) return null;
  return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * Busca un estudiante por su código.
 * @param {string} codigo
 * @returns {Promise<Estudiante|undefined>}
 */
async function buscarPorCodigo(codigo) {
  if (!codigo) return undefined;
  const normalizado = codigo.trim().toUpperCase();
  const { data, error } = await supabase
    .from(TABLA)
    .select('*')
    .eq('codigo', normalizado)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? new Estudiante(data) : undefined;
}

/**
 * Busca un estudiante por su correo electrónico.
 * @param {string} correo
 * @returns {Promise<Estudiante|undefined>}
 */
async function buscarPorCorreo(correo) {
  if (!correo) return undefined;
  const normalizado = correo.trim().toLowerCase();
  const { data, error } = await supabase
    .from(TABLA)
    .select('*')
    .eq('correo', normalizado)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? new Estudiante(data) : undefined;
}

/**
 * Busca un estudiante por su código universitario o correo institucional.
 * @param {string} [codigo]
 * @param {string} [correo]
 * @returns {Promise<Estudiante|undefined>}
 */
async function buscarPorCodigoOCorreo(codigo, correo) {
  let query = supabase.from(TABLA).select('*');
  const conds = [];
  if (codigo) conds.push(`codigo.eq.${codigo.toUpperCase()}`);
  if (correo) conds.push(`correo.eq.${correo.toLowerCase()}`);
  
  if (conds.length === 0) return undefined;
  
  const { data, error } = await query.or(conds.join(',')).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? new Estudiante(data) : undefined;
}

/**
 * Registra un nuevo estudiante en el sistema validando que el correo sea @uncp.edu.pe.
 * Extrae el código universitario del correo.
 * @param {Object} datos
 * @param {string} datos.nombre
 * @param {string} datos.correo
 * @param {string} datos.password
 * @returns {Promise<Estudiante>} El estudiante registrado.
 */
async function registrarEstudiante({ nombre, correo, password }) {
  if (!nombre || nombre.trim() === '') {
    throw new Error('El nombre es requerido para registrarse.');
  }
  if (!correo || correo.trim() === '') {
    throw new Error('El correo electrónico es requerido.');
  }
  
  const correoNormalizado = correo.trim().toLowerCase();
  if (!correoNormalizado.endsWith('@uncp.edu.pe')) {
    throw new Error('El correo debe ser institucional (@uncp.edu.pe).');
  }

  if (!password || password.length < 8) {
    throw new Error('La contraseña debe tener al menos 8 caracteres.');
  }

  // Extraer código (lo que esté antes del @)
  const partes = correoNormalizado.split('@');
  const codigo = partes[0].toUpperCase();

  // Verificar duplicados por correo o por código
  const estudianteExistenteCorreo = await buscarPorCorreo(correoNormalizado);
  if (estudianteExistenteCorreo) {
    throw new Error('El correo electrónico ya se encuentra registrado.');
  }

  const estudianteExistenteCodigo = await buscarPorCodigo(codigo);
  if (estudianteExistenteCodigo) {
    throw new Error('El código de estudiante correspondiente a este correo ya está registrado.');
  }

  const id = 'E' + Date.now();
  const nuevo = {
    id,
    nombre: nombre.trim(),
    codigo,
    correo: correoNormalizado,
    password: hashPassword(password),
    puntos: 0,
    sandwiches: 0,
    cafes_gratis: 0
  };

  const { data, error } = await supabase.from(TABLA).insert([nuevo]).select().single();
  if (error) throw new Error(error.message);

  return new Estudiante(data);
}

/**
 * Verifica si las credenciales de un estudiante o administrador son correctas.
 * @param {string} correo
 * @param {string} password
 * @returns {Promise<Estudiante|Object>} El objeto estudiante o administrador autenticado.
 */
async function verificarCredenciales(correo, password) {
  if (!correo || !password) {
    throw new Error('El correo y la contraseña son requeridos.');
  }

  const correoNormalizado = correo.trim().toLowerCase();

  // Caso: Administrador
  if (correoNormalizado === 'admin@uncp.edu.pe') {
    if (password === '1234' || password === 'admin1234') {
      return {
        id: 'admin',
        nombre: 'Sr. Julio',
        correo: 'admin@uncp.edu.pe',
        rol: 'vendedor'
      };
    } else {
      throw new Error('Contraseña de administrador incorrecta.');
    }
  }

  // Caso: Estudiante
  const est = await buscarPorCorreo(correoNormalizado);
  if (!est) {
    throw new Error('Correo o contraseña incorrectos.');
  }

  const hashIngresado = hashPassword(password);
  if (est.password !== hashIngresado) {
    throw new Error('Correo o contraseña incorrectos.');
  }

  return est;
}

/**
 * Obtiene un estudiante por su ID.
 * @param {string} id
 * @returns {Promise<Estudiante|undefined>}
 */
async function obtenerEstudiantePorId(id) {
  const { data, error } = await supabase.from(TABLA).select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? new Estudiante(data) : undefined;
}

module.exports = {
  buscarPorCodigo,
  buscarPorCorreo,
  buscarPorCodigoOCorreo,
  registrarEstudiante,
  verificarCredenciales,
  obtenerEstudiantePorId,
  hashPassword,
};

