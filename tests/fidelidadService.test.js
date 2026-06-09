const fidelidadService = require('../src/services/fidelidadService');
const Estudiante = require('../src/models/Estudiante');
const { db, reset } = require('../src/data/memoria');

describe('fidelidadService', () => {
  beforeEach(() => {
    reset();
    db.estudiantes.push(new Estudiante({ id: 'E1', nombre: 'Ana Quispe' }));
  });

  test('calcula 1 punto por cada sol gastado (redondeo hacia abajo)', () => {
    expect(fidelidadService.calcularPuntos(11.5)).toBe(11);
    expect(fidelidadService.calcularPuntos(0.99)).toBe(0);
  });

  test('acredita puntos al estudiante', () => {
    const total = fidelidadService.acreditarPuntos('E1', 11);
    expect(total).toBe(11);
  });

  test('canjea puntos disponibles', () => {
    fidelidadService.acreditarPuntos('E1', 20);
    const restantes = fidelidadService.canjearPuntos('E1', 15);
    expect(restantes).toBe(5);
  });

  test('rechaza canje con puntos insuficientes', () => {
    fidelidadService.acreditarPuntos('E1', 5);
    expect(() => fidelidadService.canjearPuntos('E1', 10)).toThrow();
  });

  test('rechaza estudiante inexistente', () => {
    expect(() => fidelidadService.acreditarPuntos('NO-EXISTE', 10)).toThrow();
  });
});
