# Bitacora de Pair Programming

**Proyecto:** IngenioSnack
**Practica XP - IS055B**

Registro de las sesiones de programacion en parejas. En XP la pareja rota los roles
de **Driver** (escribe el codigo) y **Navigator** (revisa, piensa en el diseno).

---

## Sesiones

### Sesion 1 — Dia 1 | Pareja Backend + Tests

| Campo          | Detalle                                                                 |
|----------------|-------------------------------------------------------------------------|
| Fecha          | 09/06/2026                                                              |
| Hora inicio    | 08:00                                                                   |
| Duracion       | 2 horas                                                                 |
| Driver         | Integrante 2 — Chavez Paquiyauri Jack Luis                              |
| Navigator      | Integrante 3 — Flores Ccente Franklin David                             |
| Historia/Tarea | HU-01 — Consultar menu disponible / HU-04 parcial — Disponibilidad      |
| Objetivo       | Crear modelos, menuService con stubs de funciones y primer test RED     |
| Resultado      | `Producto.js`, `memoria.js` y `menuService.js` creados con las funciones `registrarProducto`, `listarProductos`, `listarProductosDisponibles`, `cambiarDisponibilidadProducto`. Tests unitarios escritos en `menuService.test.js`. |
| Aprendizajes   | El ciclo TDD exige escribir la prueba antes que la implementacion. La fase RED confirma que el test existe y detecta la ausencia de logica. |
| Pendientes     | Completar implementacion y verificar todos los tests en verde.          |

---

### Sesion 2 — Dia 1 | Pareja Frontend + Documentacion

| Campo          | Detalle                                                                 |
|----------------|-------------------------------------------------------------------------|
| Fecha          | 09/06/2026                                                              |
| Hora inicio    | 08:00                                                                   |
| Duracion       | 2 horas                                                                 |
| Driver         | Integrante 1 — Artica Arias Gustavo Alonso                              |
| Navigator      | Integrante 4 — Jayo Mallqui Alexsander Antoni                           |
| Historia/Tarea | HU-01 — Vista del menu / Estructura documental Semana 10                |
| Objetivo       | Pantalla visual de menu en consola, README actualizado, bitacora Dia 1  |
| Resultado      | `app.js` actualizado con funcion `mostrarPantallaPrincipal()` que muestra el menu organizado por categorias con estado de disponibilidad. README y estructura `docs/Semana_10/` completados. |
| Aprendizajes   | Separar la logica de presentacion en su propia funcion facilita las pruebas y la futura migracion a una UI web o movil real. |
| Pendientes     | Dia 2: conectar la vista con el flujo de creacion de pedido.            |

---

### Sesion 3 — Dia 1 | Implementacion minima HU-01

**Fecha:** 09/06/2026
**Historia trabajada:** HU-01 — Consultar menu disponible

| Rol XP    | Integrante                          |
|-----------|-------------------------------------|
| Conductor | Integrante 3 — Flores Ccente Franklin David |
| Navegador | Integrante 2 — Chavez Paquiyauri Jack Luis  |

#### Actividad realizada

Se implemento el codigo minimo necesario para que todas las pruebas de menu pasen
correctamente (fase GREEN del ciclo TDD). Se completo `menuService.js` con la logica
real de `listarProductosDisponibles` (filtra por `disponible === true`) y se
unifico `memoria.js` para exportar el objeto directamente.

#### Resultado

Todas las pruebas de `menuService.test.js` pasan en verde, cumpliendo la fase Green
del ciclo TDD para HU-01.

---

### Sesion 4 — Dia 4 | Pareja Backend + Tests

| Campo          | Detalle                                                                          |
|----------------|----------------------------------------------------------------------------------|
| Fecha          | 09/06/2026                                                                       |
| Hora inicio    | 08:00                                                                            |
| Duracion       | 2 horas                                                                          |
| Driver         | Integrante 2 — Chavez Paquiyauri Jack Luis                                       |
| Navigator      | Integrante 3 — Flores Ccente Franklin David                                      |
| Historia/Tarea | HU-03 — Validar disponibilidad antes de confirmar pedido                         |
| Objetivo       | Implementar `validarDisponibilidadPedido`, `confirmarPedido`, `calcularTotalPedido` y refactorizar codigo |
| Resultado      | `pedidoService.js` actualizado con 3 nuevas funciones exportadas. `Pedido.js` con estado `CONFIRMADO`. 9 tests nuevos agregados — todos en verde. `REFACTORIZACION.md` con 4 refactors documentados. |
| Aprendizajes   | Extraer la validacion en su propia funcion (Extract Method) permite testearla de forma aislada y reutilizarla en `confirmarPedido`. La fase Refactor no cambia comportamiento, solo mejora legibilidad. |
| Pendientes     | Dia 5: integracion final, flujo completo en app.js, evidencias finales.          |

---

### Sesion 5 — Dia 4 | Pareja Frontend + Documentacion

| Campo          | Detalle                                                                          |
|----------------|----------------------------------------------------------------------------------|
| Fecha          | 09/06/2026                                                                       |
| Hora inicio    | 08:00                                                                            |
| Duracion       | 2 horas                                                                          |
| Driver         | Integrante 1 — Artica Arias Gustavo Alonso                                       |
| Navigator      | Integrante 4 — Jayo Mallqui Alexsander Antoni                                    |
| Historia/Tarea | HU-03 — Vista de validacion / Documentacion Dia 4                                |
| Objetivo       | Mejorar mensajes visuales en app.js, actualizar README y REFACTORIZACION.md      |
| Resultado      | `app.js` con `mostrarResumenPedido`, `mostrarMensaje` y flujo de validacion. `REFACTORIZACION.md` completo con 4 refactors documentados. README actualizado con estado HU-03 en verde. |
| Aprendizajes   | Los mensajes visuales claros (producto no disponible, pedido confirmado) mejoran la experiencia sin necesidad de una UI web real. |
| Pendientes     | Tomar captura `03_refactor_codigo_limpio.png` con los tests en verde.            |

---

## Plantilla para sesiones futuras

| Campo            | Detalle |
|------------------|---------|
| Fecha            |         |
| Hora inicio      |         |
| Duracion         |         |
| Driver           |         |
| Navigator        |         |
| Historia/Tarea   |         |
| Objetivo         |         |
| Resultado        |         |
| Aprendizajes     |         |
| Pendientes       |         |
