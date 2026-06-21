const memoria = require('../src/data/memoria');
const estudianteService = require('../src/services/estudianteService');

beforeEach(() => {
  memoria.estudiantes = [];
});

describe('estudianteService — registro', () => {
  test('debe registrar un estudiante con correo y contraseña hasheada', () => {
    const est = estudianteService.registrarEstudiante({
      nombre: 'Pedro Perez',
      correo: '2024101130E@uncp.edu.pe',
      password: 'password123',
    });

    expect(est.nombre).toBe('Pedro Perez');
    expect(est.correo).toBe('2024101130e@uncp.edu.pe');
    expect(est.codigo).toBe('2024101130E'); // Código extraído
    expect(est.password).not.toBe('password123'); // Debería estar hasheado
    expect(est.password).toBe(estudianteService.hashPassword('password123'));
    expect(memoria.estudiantes).toHaveLength(1);
  });

  test('debe rechazar registro sin nombre', () => {
    expect(() => {
      estudianteService.registrarEstudiante({
        nombre: '',
        correo: '2024101130E@uncp.edu.pe',
        password: 'password123',
      });
    }).toThrow('El nombre es requerido');
  });

  test('debe rechazar registro sin correo', () => {
    expect(() => {
      estudianteService.registrarEstudiante({
        nombre: 'Pedro',
        correo: '',
        password: 'password123',
      });
    }).toThrow('El correo electrónico es requerido.');
  });

  test('debe rechazar correo que no sea @uncp.edu.pe', () => {
    expect(() => {
      estudianteService.registrarEstudiante({
        nombre: 'Pedro',
        correo: 'pedro@gmail.com',
        password: 'password123',
      });
    }).toThrow('El correo debe ser institucional (@uncp.edu.pe).');
  });

  test('debe rechazar registro con contraseña menor a 8 caracteres', () => {
    expect(() => {
      estudianteService.registrarEstudiante({
        nombre: 'Pedro',
        correo: '2024101130E@uncp.edu.pe',
        password: '123',
      });
    }).toThrow('La contraseña debe tener al menos 8 caracteres.');
  });

  test('debe rechazar correos duplicados', () => {
    estudianteService.registrarEstudiante({
      nombre: 'Pedro Perez',
      correo: '2024101130E@uncp.edu.pe',
      password: 'password123',
    });

    expect(() => {
      estudianteService.registrarEstudiante({
        nombre: 'Otro Pedro',
        correo: '2024101130E@uncp.edu.pe',
        password: 'password123',
      });
    }).toThrow('El correo electrónico ya se encuentra registrado.');
  });
});

describe('estudianteService — autenticación unificada', () => {
  beforeEach(() => {
    estudianteService.registrarEstudiante({
      nombre: 'Pedro Perez',
      correo: '2024101130E@uncp.edu.pe',
      password: 'password123',
    });
  });

  test('debe autenticar correctamente con las credenciales correctas de estudiante', () => {
    const est = estudianteService.verificarCredenciales('2024101130e@uncp.edu.pe', 'password123');
    expect(est.nombre).toBe('Pedro Perez');
  });

  test('debe autenticar al administrador con admin@uncp.edu.pe y contraseña 1234', () => {
    const admin = estudianteService.verificarCredenciales('admin@uncp.edu.pe', '1234');
    expect(admin.nombre).toBe('Sr. Julio');
    expect(admin.rol).toBe('vendedor');
  });

  test('debe fallar autenticación si la contraseña es incorrecta', () => {
    expect(() => {
      estudianteService.verificarCredenciales('2024101130E@uncp.edu.pe', 'clave_incorrecta');
    }).toThrow('Correo o contraseña incorrectos.');
  });

  test('debe fallar autenticación si el correo no existe', () => {
    expect(() => {
      estudianteService.verificarCredenciales('noexiste@uncp.edu.pe', 'password123');
    }).toThrow('Correo o contraseña incorrectos.');
  });
});
