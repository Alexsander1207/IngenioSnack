# Plan de Sprint - MVP en 5 dias

**Proyecto:** IngenioSnack
**Asignatura:** Metodologia de Desarrollo de Software (IS055B) - Unidad II: XP
**Sprint:** MVP (5 dias)

## Objetivo del sprint

Construir el MVP funcional del sistema de pedidos anticipados que permita: ver el
menu, crear un pedido, gestionar su estado y acumular puntos de fidelidad, aplicando
TDD y pair programming.

## Historias de usuario incluidas

| ID  | Historia                                                                 | Prioridad | Estimacion (pts) |
|-----|--------------------------------------------------------------------------|-----------|------------------|
| HU1 | Como estudiante quiero ver el menu disponible                            | Alta      | 2                |
| HU2 | Como estudiante quiero crear un pedido desde mi celular                  | Alta      | 5                |
| HU3 | Como cafetero quiero cambiar el estado de un pedido                      | Media     | 3                |
| HU4 | Como estudiante quiero acumular puntos por mis compras                   | Media     | 3                |
| HU5 | Como estudiante quiero canjear mis puntos de fidelidad                   | Baja      | 2                |

## Cronograma (5 dias)

| Dia | Foco                                  | Entregable                                  | Responsables |
|-----|---------------------------------------|---------------------------------------------|--------------|
| 1   | Setup, modelos y menuService (HU1)    | Estructura + tests de menu en verde         | TBD          |
| 2   | pedidoService - creacion (HU2)        | Crear pedido + calculo de total             | TBD          |
| 3   | pedidoService - estados (HU3)         | Cambio de estados + validaciones            | TBD          |
| 4   | fidelidadService (HU4, HU5)           | Acreditar y canjear puntos                  | TBD          |
| 5   | Integracion (app.js), refactor, docs  | Flujo completo + evidencias TDD             | TBD          |

## Definicion de Terminado (DoD)

- [ ] Codigo con pruebas unitarias en verde (`npm test`).
- [ ] Cobertura de los servicios principales.
- [ ] Sin codigo duplicado evidente (refactor aplicado).
- [ ] Evidencias TDD (red/green/refactor) adjuntas.
- [ ] Bitacora de pair programming actualizada.

## Avance Dia 2

### Historia trabajada

- HU-01: Consultar menu disponible.
- HU-04 parcial: Actualizar disponibilidad del menu.

### Tareas cerradas

- Modelo Producto implementado.
- Servicio de menu implementado.
- Pruebas unitarias de menu completadas.
- Evidencia Green generada.
- README actualizado.

### Estado

Dia 2 completado.

## Avance Dia 3

### Historia trabajada

- HU-02: Realizar pedido anticipado.
- HU-06: Identificar estudiante para pedidos.
- HU-03 parcial: Validar disponibilidad antes de confirmar.

### Tareas cerradas

- Modelos Estudiante (con correo), ItemPedido y Pedido en uso.
- Servicio de pedidos con crearPedido, agregarItemPedido, calcularSubtotal y
  calcularTotalPedido.
- Prueba unitaria de calculo total en verde.
- README y bitacora actualizados.

### Estado

Dia 3 completado.
