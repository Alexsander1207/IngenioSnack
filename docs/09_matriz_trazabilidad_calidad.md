# 09. Matriz de trazabilidad y calidad XP

Este documento refuerza la evidencia de calidad del proyecto. Relaciona requerimientos, historias de usuario, criterios de aceptacion, pruebas y prioridad.

## 1. Matriz de trazabilidad

| Requerimiento | Historia relacionada | Prueba de aceptacion | Prioridad | Iteracion |
|---|---|---|---|---|
| RF-01 Identificacion del estudiante | HU-01 | PA-01, PA-02, PA-03 | Alta | Iteracion 1 |
| RF-02 Mostrar menu disponible | HU-02 | PA-04, PA-05, PA-06 | Alta | Iteracion 1 |
| RF-03 Pedido anticipado desde celular | HU-03 | PA-07, PA-08, PA-09 | Alta | Iteracion 1 |
| RF-05 Validar disponibilidad | HU-04 | PA-10, PA-11, PA-12 | Alta | Iteracion 1 |
| RF-06 Gestion rapida de disponibilidad | HU-05 | PA-13, PA-14, PA-15 | Alta | Iteracion 1 |
| RF-10 Pago contra entrega | HU-06 | Pendiente | Alta | Iteracion futura |
| RF-07 Registro de fidelidad | HU-07 | Pendiente | Media | Iteracion futura |
| RF-09 Productos mas vendidos | HU-08 | Pendiente | Media | Iteracion futura |
| RF-11 Lista de pedidos pendientes | HU-09 | Pendiente | Alta | Iteracion futura |

## 2. Validacion INVEST

La tecnica INVEST permite evaluar si una historia de usuario esta bien formulada.

| Historia | I Independiente | N Negociable | V Valiosa | E Estimable | S Pequena | T Probable/Testeable | Observacion |
|---|---|---|---|---|---|---|---|
| HU-01 | Si | Si | Si | Si | Si | Si | Base para pedidos y fidelidad. |
| HU-02 | Si | Si | Si | Si | Si | Si | Entrega valor inmediato al estudiante. |
| HU-03 | Parcial | Si | Si | Si | Si | Si | Depende de menu disponible. |
| HU-04 | Parcial | Si | Si | Si | Si | Si | Depende de producto y menu. |
| HU-05 | Si | Si | Si | Si | Si | Si | Permite actualizar oferta rapidamente. |
| HU-07 | Si | Si | Si | Si | Si | Si | Se deja para futura iteracion. |
| HU-08 | Si | Si | Si | Si | Si | Si | Apoya decisiones del negocio. |

## 3. Priorizacion MoSCoW

| Historia | MoSCoW | Motivo |
|---|---|---|
| HU-01 Identificacion del estudiante | Must Have | Necesaria para asociar pedidos. |
| HU-02 Consulta de menu | Must Have | Sin menu no hay pedido anticipado. |
| HU-03 Pedido anticipado | Must Have | Resuelve el problema principal de las filas. |
| HU-04 Validacion de disponibilidad | Must Have | Evita pedidos imposibles de preparar. |
| HU-05 Gestion de disponibilidad | Must Have | Permite reaccionar ante falta de insumos. |
| HU-06 Pago contra entrega | Should Have | Es importante, pero puede manejarse manualmente al inicio. |
| HU-07 Fidelidad | Should Have | Genera valor, pero no es critica para validar la primera entrega. |
| HU-08 Productos mas vendidos | Could Have | Mejora gestion del negocio en iteraciones posteriores. |
| HU-09 Lista de pedidos pendientes | Should Have | Debe desarrollarse pronto, pero puede dividirse en version simple. |

## 4. Riesgo por no implementar

| Historia | Riesgo si no se implementa | Nivel |
|---|---|---|
| HU-01 | No se puede asociar pedido a estudiante. | Alto |
| HU-02 | El estudiante no sabe que puede pedir. | Alto |
| HU-03 | No se reduce la fila. | Alto |
| HU-04 | Se generan pedidos que no pueden prepararse. | Alto |
| HU-05 | El menu queda desactualizado. | Alto |
| HU-07 | No se ejecuta el programa de fidelidad. | Medio |
| HU-08 | El Sr. Julio no obtiene informacion para prepararse. | Medio |

## 5. Definition of Ready

Una historia esta lista para entrar a una iteracion cuando:

- Tiene rol, accion y beneficio claramente definidos.
- Tiene criterios de aceptacion verificables.
- Tiene prioridad asignada.
- Tiene estimacion con Fibonacci.
- Tiene dependencias identificadas.
- Respeta las restricciones del cliente.

## 6. Definition of Done

Una historia se considera terminada cuando:

- Cumple todos sus criterios de aceptacion.
- Tiene pruebas de aceptacion definidas.
- No contradice las reglas de negocio.
- Esta documentada en el repositorio.
- Mantiene simplicidad XP.
- Fue revisada contra la necesidad expresada por el cliente.

## 7. Conclusion de calidad

La primera iteracion esta justificada porque concentra 20 puntos en las historias con mayor valor para el negocio. La seleccion no intenta construir todo el sistema, sino validar el flujo esencial de pedido anticipado y disponibilidad del menu.
