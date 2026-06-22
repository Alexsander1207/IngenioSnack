/**
 * Modelo Estudiante
 * Representa al cliente (estudiante) que realiza pedidos y acumula puntos
 * en el programa de fidelidad de IngenioSnack.
 */
class Estudiante {
  /**
   * @param {Object} datos
   * @param {string} datos.id        Identificador único del estudiante.
   * @param {string} datos.nombre    Nombre completo.
   * @param {string} [datos.codigo]  Código universitario (opcional).
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

  /**
   * HU-01: Acumular puntos por cada compra realizada.
   * Regla de negocio: S/ 1.00 gastado = 1 punto acumulado (basado en el total del pedido).
   * @param {number} montoTotal - El monto total pagado en el pedido.
   * @returns {number} Los nuevos puntos totales del estudiante.
   */
  acumularPuntos(montoTotal) {
    if (montoTotal <= 0) return this.puntos;
    
    // Convertimos el monto directamente a puntos (1 sol = 1 punto)
    // Usamos Math.floor para asegurar puntos enteros si hay decimales, según la lógica estándar de fidelidad
    const puntosGanados = Math.floor(montoTotal); 
    this.puntos += puntosGanados;
    
    return this.puntos;
  }

  /**
   * HU-02: Canjear puntos acumulados por productos gratis o descuentos.
   * Criterio de aceptación: Verificar si tiene los puntos suficientes antes de descontar.
   * @param {number} puntosRequeridos - Puntos que cuesta el beneficio.
   * @returns {boolean} true si el canje fue exitoso, false si no tiene suficientes puntos.
   */
  canjearPuntos(puntosRequeridos) {
    if (puntosRequeridos <= 0) return false;
    
    if (this.puntos >= puntosRequeridos) {
      this.puntos -= puntosRequeridos;
      return true; // Canje aprobado
    }
    
    return false; // Puntos insuficientes
  }

  /**
   * Permite actualizar la información del estudiante (HU-05 - Gestión de Perfil).
   * @param {Object} nuevosDatos 
   */
  actualizarPerfil({ nombre, codigo }) {
    if (nombre) this.nombre = nombre;
    if (codigo !== undefined) this.codigo = codigo;
  }
}

module.exports = Estudiante;