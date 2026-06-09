# IngenioSnack

Sistema de pedidos anticipados para la cafeteria **IngenioSnack**, ubicada al costado
de los laboratorios de la Facultad de Ingenieria de Sistemas de la UNCP.

**Asignatura:** Metodologia de Desarrollo de Software (IS055B) — Unidad II: XP
**Sprint activo:** MVP 5 dias — Semana 10

---

## Objetivo del proyecto

Resolver la acumulacion de estudiantes durante el recreo permitiendo realizar pedidos
anticipados desde el celular, recogerlos rapidamente y pagar contra entrega.

El cliente, el Sr. Julio, solicita una solucion simple que permita a los estudiantes
hacer pedidos antes de salir de clase, evitando filas largas y perdida de tiempo.

---

## Metodologia XP aplicada

| Practica XP             | Como se aplica en este proyecto                              |
|-------------------------|--------------------------------------------------------------|
| TDD                     | Cada funcionalidad inicia con una prueba fallida (RED)       |
| Pair programming        | Sesiones registradas en `docs/Semana_10/BITACORA_PAIR_PROGRAMMING.md` |
| Releases pequenos       | MVP en 5 dias con historias priorizadas                      |
| Diseno simple           | Sin frameworks, solo Node.js puro y Jest                     |
| Propiedad colectiva     | Cualquier integrante puede modificar cualquier archivo       |
| Integracion continua    | `npm test` como verificacion antes de cada commit            |

---

## Estructura del repositorio

```text
IngenioSnack/
├── src/
│   ├── models/
│   │   ├── Producto.js          # Modelo de producto del menu
│   │   ├── Estudiante.js        # Modelo de estudiante
│   │   ├── Pedido.js            # Modelo de pedido con estados
│   │   └── ItemPedido.js        # Item individual dentro de un pedido
│   ├── services/
│   │   ├── menuService.js       # HU-01, HU-04: gestion del menu
│   │   ├── pedidoService.js     # HU-02, HU-03: creacion y estados de pedidos
│   │   └── fidelidadService.js  # HU-05: puntos de fidelidad
│   ├── data/
│   │   └── memoria.js           # Almacenamiento temporal en memoria (MVP)
│   └── app.js                   # Punto de entrada + pantalla principal del menu
├── tests/
│   ├── menuService.test.js      # Tests HU-01
│   ├── pedidoService.test.js    # Tests HU-02, HU-03
│   └── fidelidadService.test.js # Tests HU-05
├── docs/
│   ├── Semana_10/
│   │   ├── PLAN_SPRINT_MVP_5_DIAS.md
│   │   ├── BITACORA_PAIR_PROGRAMMING.md
│   │   ├── REFACTORIZACION.md
│   │   └── EVIDENCIAS_TDD/      # Capturas RED - GREEN - REFACTOR
│   └── ...                      # Documentacion Semanas anteriores
├── package.json
└── .gitignore
```

---

## Historias priorizadas para Semana 10

| ID    | Historia                                         | Prioridad | Estimacion | Estado     |
|-------|--------------------------------------------------|-----------|------------|------------|
| HU-01 | Como estudiante quiero ver el menu disponible    | Alta      | 2 pts      | GREEN ✅   |
| HU-02 | Como estudiante quiero crear un pedido           | Alta      | 5 pts      | GREEN ✅   |
| HU-03 | Como cafetero quiero validar disponibilidad      | Alta      | 3 pts      | GREEN ✅   |
| HU-04 | Como cafetero quiero actualizar disponibilidad   | Alta      | 3 pts      | GREEN ✅   |
| HU-05 | Como estudiante quiero acumular puntos           | Media     | 3 pts      | GREEN ✅   |

---

## Comandos rapidos

```bash
# Instalar dependencias
npm install

# Ejecutar el sistema (pantalla principal del menu)
npm start

# Ejecutar todas las pruebas
npm test

# Ejecutar pruebas en modo watch (desarrollo)
npm run test:watch

# Ver cobertura de pruebas
npm run test:coverage
```

---

## Estado del ciclo TDD — Dia 4

```
menuService  — registrarProducto():             VERDE ✅
menuService  — listarProductosDisponibles():    VERDE ✅
menuService  — cambiarDisponibilidadProducto(): VERDE ✅
pedidoService — crearPedido():                  VERDE ✅
pedidoService — validarDisponibilidadPedido():  VERDE ✅  (Dia 4)
pedidoService — confirmarPedido():              VERDE ✅  (Dia 4)
pedidoService — calcularTotalPedido():          VERDE ✅  (Dia 4 - Refactor)
fidelidadService — acreditarPuntos():           VERDE ✅
fidelidadService — canjearPuntos():             VERDE ✅
```

La evidencia del ciclo RED-GREEN-REFACTOR se encuentra en:
`docs/Semana_10/EVIDENCIAS_TDD/`

### Regla de negocio implementada (HU-03)

Solo se puede confirmar un pedido si **todos** los productos seleccionados
tienen `disponible: true`. Si alguno esta agotado, el sistema bloquea la
confirmacion con el mensaje: *"El pedido contiene productos no disponibles"*.

---

## Decisiones relevantes

- El pago sera **contra entrega**, como indico el cliente.
- No se implementa Yape, Plin ni tarjeta en esta primera iteracion.
- El cafe gratis sera **cafe americano**, la recompensa mencionada por el cliente.
- El sistema identifica al estudiante mediante correo institucional o codigo universitario.
- Si no hay ingredientes disponibles, el sistema avisa antes de confirmar el pedido.

---

## Integrantes

| # | Nombre                            | Rol principal en Sprint MVP  |
|---|-----------------------------------|------------------------------|
| 1 | Artica Arias Gustavo Alonso       | Frontend y diseno visual      |
| 2 | Chavez Paquiyauri Jack Luis       | Backend y logica del sistema  |
| 3 | Flores Ccente Franklin David      | Tests, TDD y refactorizacion  |
| 4 | Jayo Mallqui Alexsander Antoni    | Documentacion y evidencias    |
| 5 | Raymundo Condor Frank Angel       | Integracion y soporte         |

## Estado

Practica desarrollada para entrega academica en ADESA y evidencia en GitHub.
