/**
 * Modelo Estudiante
 * Representa al cliente (estudiante) que realiza pedidos y acumula puntos
 * en el programa de fidelidad de IngenioSnack.
 */
class Estudiante {
  /**
   * @param {Object} datos
   * @param {string} datos.id       Identificador único del estudiante.
   * @param {string} datos.nombre   Nombre completo.
   * @param {string} [datos.codigo] Código universitario (opcional).
   * @param {number} [datos.puntos=0] Puntos de fidelidad acumulados.
   */
  constructor({ id, nombre, codigo = null, puntos = 0 }) {
    this.id = id;
    this.nombre = nombre;
    this.codigo = codigo;
    // Restricción del sistema: Los puntos iniciales no pueden ser negativos
    this.puntos = puntos >= 0 ? puntos : 0;
  }

  /**
   * HU-01: Acumular puntos por cada compra realizada.
   * Regla de negocio: S/ 1.00 gastado = 1 punto acumulado (basado en el total del pedido).
   * @param {number} montoTotal - El monto total pagado en el pedido.
   * @returns {number} Los nuevos puntos totales del estudiante.
   */
  acumularPuntos(montoTotal) {
    // Validación: Si el monto no es válido o es menor/igual a cero, no altera los puntos
    if (!montoTotal || typeof montoTotal !== 'number' || montoTotal <= 0) {
      return this.puntos;
    }
    
    // Convertimos el monto directamente a puntos (1 sol = 1 punto)
    // Usamos Math.floor para asegurar enteros si el estudiante paga con céntimos
    const puntosGanados = Math.floor(montoTotal); 
    this.puntos += puntosGanados;
    
    return this.puntos;
  }

  /**
   * HU-02: Canjear puntos acumulados por productos gratis o descuentos.
   * Criterio de aceptación: Verificar si tiene los puntos suficientes antes de descontar.
   * @param {number} puntosRequeridos - Puntos que cuesta el beneficio.
   * @returns {boolean} true si el canje fue exitoso, false si no tiene suficientes puntos o la cantidad es inválida.
   */
  canjearPuntos(puntosRequeridos) {
    // Validación de seguridad: no se pueden canjear puntos negativos o valores no numéricos
    if (!puntosRequeridos || typeof puntosRequeridos !== 'number' || puntosRequeridos <= 0) {
      return false;
    }
    
    // Criterio de Aceptación: Verificar saldo suficiente
    if (this.puntos >= puntosRequeridos) {
      this.puntos -= puntosRequeridos;
      return true; // Canje aprobado e historial actualizado internamente
    }
    
    return false; // Puntos insuficientes (No permite saldos negativos)
  }

  /**
   * HU-05: Gestión de Perfil de Usuario.
   * Criterio de aceptación: Permite modificar los datos del estudiante de forma segura.
   * @param {Object} nuevosDatos 
   * @param {string} [nuevosDatos.nombre] - Nuevo nombre completo.
   * @param {string} [nuevosDatos.codigo] - Nuevo código universitario.
   * @returns {Object} El perfil actualizado del estudiante.
   */
  actualizarPerfil({ nombre, codigo }) {
    // Validación básica: Evitar cadenas vacías accidentales si se envía el parámetro
    if (nombre && nombre.trim() !== "") {
      this.nombre = nombre.trim();
    }
    
    if (codigo !== undefined) {
      // Si envían código vacío o null, se asume que se limpia el campo opcional
      this.codigo = codigo && codigo.trim() !== "" ? codigo.trim() : null;
    }

    return {
      id: this.id,
      nombre: this.nombre,
      codigo: this.codigo,
      puntos: this.puntos
    };
  }
}

module.exports = Estudiante;