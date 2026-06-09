# IngenioSnack — MVP Final

Sistema de pedidos anticipados para la cafeteria **IngenioSnack**, ubicada al costado
de los laboratorios de la Facultad de Ingenieria de Sistemas de la UNCP.

**Asignatura:** Metodologia de Desarrollo de Software (IS055B) — Unidad II: XP
**Sprint:** MVP 5 dias — Semana 10 — **ENTREGADO**

---

## Descripcion del proyecto

**IngenioSnack** resuelve el problema de acumulacion de estudiantes durante el recreo.
Los estudiantes realizan pedidos anticipados desde su celular antes de salir de clase,
los recogen rapidamente y pagan contra entrega, eliminando las filas y la perdida de tiempo.

---

## Metodologia XP aplicada

| Practica XP             | Evidencia en este proyecto                                    |
|-------------------------|---------------------------------------------------------------|
| **TDD**                 | Ciclo Red-Green-Refactor documentado en `EVIDENCIAS_TDD/`    |
| **Pair programming**    | 7 sesiones en `BITACORA_PAIR_PROGRAMMING.md`                 |
| **Releases pequeños**   | MVP funcional en 5 dias                                       |
| **Diseño simple**       | Sin frameworks, solo Node.js puro y Jest                      |
| **Propiedad colectiva** | Cualquier integrante modifica cualquier archivo               |
| **Integracion continua**| `npm test` ejecutado en cada commit                           |
| **Refactorizacion**     | 4 refactors documentados en `REFACTORIZACION.md`              |

---

## Historias de usuario implementadas

| ID    | Historia                                          | Prioridad | Estimacion | Estado     |
|-------|---------------------------------------------------|-----------|------------|------------|
| HU-01 | Identificacion del estudiante                     | Alta      | 3 pts      | ✅ Cerrada |
| HU-02 | Consulta del menu disponible                      | Alta      | 3 pts      | ✅ Cerrada |
| HU-03 | Pedido anticipado desde celular                   | Alta      | 5 pts      | ✅ Cerrada |
| HU-04 | Validacion de disponibilidad antes de confirmar   | Alta      | 5 pts      | ✅ Cerrada |
| HU-05 | Gestion rapida de disponibilidad (Sr. Julio)      | Alta      | 4 pts      | ✅ Cerrada |
| HU-06 | Pago contra entrega y cambio de estado            | Alta      | 3 pts      | ✅ Cerrada |
| HU-07 | Registro de sandwiches para fidelidad             | Media     | 5 pts      | ✅ Cerrada |

**Historias para siguiente iteracion:** HU-08 (productos mas vendidos), HU-09 (lista pedidos pendientes), interfaz web, base de datos real.

---

## Estructura del repositorio

```text
IngenioSnack/
├── src/
│   ├── models/
│   │   ├── Producto.js          - id, nombre, precio, categoria, disponible
│   │   ├── Estudiante.js        - id, nombre, codigo, correo, puntos, sandwiches, cafesGratis
│   │   ├── Pedido.js            - id, estudianteId, items, estado, fecha, total (getter)
│   │   └── ItemPedido.js        - producto, cantidad, subtotal (getter)
│   ├── services/
│   │   ├── menuService.js       - HU-02, HU-05: registrar, listar, cambiar disponibilidad
│   │   ├── pedidoService.js     - HU-03, HU-04, HU-06: crear, validar, confirmar, entregar
│   │   └── fidelidadService.js  - HU-07: puntos, sandwiches, cafes gratis
│   ├── data/
│   │   └── memoria.js           - almacenamiento en memoria para el MVP
│   └── app.js                   - flujo MVP completo (demo ejecutable)
├── tests/
│   ├── menuService.test.js      - 5 tests: HU-02, HU-05
│   ├── pedidoService.test.js    - 12 tests: HU-03, HU-04, HU-06
│   └── fidelidadService.test.js - 5 tests: HU-07
├── docs/
│   └── Semana_10/
│       ├── PLAN_SPRINT_MVP_5_DIAS.md
│       ├── BITACORA_PAIR_PROGRAMMING.md  (7 sesiones documentadas)
│       ├── REFACTORIZACION.md            (4 refactors con antes/despues)
│       └── EVIDENCIAS_TDD/
│           ├── 01_red_test_fallando.png
│           ├── 02_green_test_pasando.png
│           └── 03_refactor_codigo_limpio.png
├── package.json
└── .gitignore
```

---

## Tecnologias utilizadas

| Herramienta | Version  | Uso                                  |
|-------------|----------|--------------------------------------|
| Node.js     | v22.x    | Runtime del servidor                 |
| Jest        | ^29.7.0  | Framework de pruebas unitarias (TDD) |
| JavaScript  | ES2020   | Lenguaje principal                   |

---

## Comandos de ejecucion

```bash
# Instalar dependencias
npm install

# Ejecutar el MVP completo (flujo demo)
npm start

# Ejecutar todas las pruebas
npm test

# Pruebas en modo watch (desarrollo)
npm run test:watch

# Cobertura de pruebas
npm run test:coverage
```

---

## Estado final del MVP — Dia 5

```
Tests: 22/22 en verde ✅

menuService
  ✅ registrarProducto
  ✅ listarProductos
  ✅ listarProductosDisponibles
  ✅ cambiarDisponibilidadProducto

pedidoService
  ✅ crearPedido (con validacion de disponibilidad)
  ✅ validarDisponibilidadPedido
  ✅ confirmarPedido
  ✅ cambiarEstado (PENDIENTE → CONFIRMADO → EN_PREPARACION → LISTO → ENTREGADO)
  ✅ calcularTotalPedido
  ✅ calcularSubtotal
  ✅ agregarItemPedido

fidelidadService
  ✅ acreditarPuntos (1 punto por cada S/ 1 gastado)
  ✅ canjearPuntos
  ✅ registrarSandwich (10 sandwiches = 1 cafe gratis)
  ✅ obtenerBeneficios
  ✅ canjearCafeGratis
```

### Regla de negocio central (HU-04)

Solo se puede confirmar un pedido si **todos** los productos tienen `disponible: true`.
Si alguno esta agotado: *"El pedido contiene productos no disponibles"*.

### Programa de fidelidad (HU-07)

- 1 punto de fidelidad por cada S/ 1 gastado en pedidos entregados.
- Cada 10 sandwiches comprados y entregados: 1 cafe americano gratis.
- El contador se reinicia automaticamente al canjear el beneficio.

---

## Decisiones relevantes

- Pago **contra entrega** — sin integracion bancaria en esta iteracion.
- **Cafe americano gratis** es la recompensa (mencionada expresamente por el cliente).
- Identificacion por **codigo universitario** o correo institucional.
- Almacenamiento **en memoria** (MVP sin base de datos).

---

## Integrantes

| # | Nombre                            | Rol principal                |
|---|-----------------------------------|------------------------------|
| 1 | Artica Arias Gustavo Alonso       | Frontend y diseno visual      |
| 2 | Chavez Paquiyauri Jack Luis       | Backend y logica del sistema  |
| 3 | Flores Ccente Franklin David      | Tests, TDD y refactorizacion  |
| 4 | Jayo Mallqui Alexsander Antoni    | Documentacion y evidencias    |
| 5 | Raymundo Condor Frank Angel       | Integracion y soporte         |

---

*Practica desarrollada para entrega academica en ADESA — IS055B UNCP FIS*
