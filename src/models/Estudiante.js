/**
 * Modelo Estudiante
 * Representa al cliente (estudiante) que realiza pedidos y acumula puntos
 * en el programa de fidelidad.
 */
class Estudiante {
  /**
   * @param {Object} datos
   * @param {string} datos.id      Identificador unico del estudiante.
   * @param {string} datos.nombre  Nombre completo.
   * @param {string} [datos.codigo] Codigo universitario (opcional).
   * @param {string} [datos.correo] Correo institucional (opcional).
   * @param {number} [datos.puntos=0] Puntos de fidelidad acumulados.
   */
  constructor({ id, nombre, codigo = null, correo = null, puntos = 0 }) {
    this.id = id;
    this.nombre = nombre;
    this.codigo = codigo;
    this.correo = correo;
    this.puntos = puntos;
  }
}

module.exports = Estudiante;
