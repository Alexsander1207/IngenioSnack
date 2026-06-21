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
  constructor({ id, nombre, codigo = null, correo = null, puntos = 0, sandwiches = 0, cafesGratis = 0, cafes_gratis = 0, password = null }) {
    this.id = id;
    this.nombre = nombre;
    this.codigo = codigo;
    this.correo = correo;
    this.puntos = puntos;
    this.sandwiches = sandwiches;
    this.cafesGratis = cafesGratis || cafes_gratis || 0;
    this.password = password;
  }
}

module.exports = Estudiante;
