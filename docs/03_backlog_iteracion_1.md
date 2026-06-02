# 03. Backlog e Iteracion 1

## 1. Criterio de estimacion

Se utilizo **Planning Poker** con la secuencia de Fibonacci:

```text
1, 2, 3, 5, 8, 13
```

La estimacion considera complejidad funcional, incertidumbre, dependencias y riesgo. No representa horas exactas.

## 2. Product Backlog priorizado

| Orden | ID | Historia de usuario | Prioridad | Estimacion | Estado para Iteracion 1 |
|---:|---|---|---|---:|---|
| 1 | HU-02 | Consulta de menu disponible | Alta | 3 | Incluida |
| 2 | HU-03 | Pedido anticipado desde celular | Alta | 5 | Incluida |
| 3 | HU-04 | Validacion de disponibilidad | Alta | 5 | Incluida |
| 4 | HU-05 | Gestion rapida de disponibilidad | Alta | 4 | Incluida |
| 5 | HU-01 | Identificacion del estudiante | Alta | 3 | Incluida |
| 6 | HU-06 | Pago contra entrega | Alta | 3 | Pendiente |
| 7 | HU-09 | Lista de pedidos pendientes | Alta | 5 | Pendiente |
| 8 | HU-07 | Registro de compras para fidelidad | Media | 5 | Pendiente |
| 9 | HU-08 | Productos mas vendidos | Media | 5 | Pendiente |

## 3. Capacidad de la Iteracion 1

La practica indica que el equipo tiene una capacidad de **20 puntos de historia** para dos semanas.

## 4. Historias seleccionadas para la Iteracion 1

| ID | Historia | Puntos | Justificacion |
|---|---|---:|---|
| HU-02 | Consulta de menu disponible | 3 | El estudiante necesita saber que puede pedir antes de seleccionar productos. |
| HU-03 | Pedido anticipado desde celular | 5 | Es la funcionalidad principal para reducir filas. |
| HU-04 | Validacion de disponibilidad | 5 | Evita pedidos imposibles de preparar. |
| HU-05 | Gestion rapida de disponibilidad | 4 | Permite al Sr. Julio actualizar el menu cuando falten ingredientes. |
| HU-01 | Identificacion del estudiante | 3 | Permite asociar pedidos al estudiante y deja base para fidelidad. |
| **Total** |  | **20** | Capacidad completa de la iteracion. |

## 5. Historias no incluidas en la Iteracion 1

| ID | Historia | Motivo de postergacion |
|---|---|---|
| HU-06 | Pago contra entrega | Puede resolverse manualmente al recojo en la primera prueba; se documenta como regla de negocio. |
| HU-07 | Registro de compras para fidelidad | Es valioso, pero no resuelve directamente la fila inicial. |
| HU-08 | Productos mas vendidos | Es util para decisiones futuras, pero no es esencial para validar el pedido anticipado. |
| HU-09 | Lista de pedidos pendientes | Es importante, pero se puede dividir en una version mas simple para la siguiente iteracion. |

## 6. Alcance funcional de la Iteracion 1

La primera entrega permitira que:

1. El estudiante se identifique.
2. El estudiante consulte el menu disponible.
3. El estudiante realice un pedido anticipado.
4. El sistema valide que el producto este disponible.
5. El Sr. Julio actualice la disponibilidad de productos rapidamente.

## 7. Fuera de alcance de la Iteracion 1

- Pasarela de pagos.
- Yape, Plin o tarjetas.
- Delivery.
- Analitica avanzada.
- Inventario detallado por ingredientes.
- Programa completo de fidelidad.
- Predicciones de demanda.

## 8. Justificacion XP

La seleccion cumple el principio de **simplicidad** de XP. En lugar de construir un sistema grande, se prioriza una primera version que ataca el problema mas critico: la fila en el recreo. La iteracion entrega valor directo al estudiante y al cliente sin agregar complejidad innecesaria.

## 9. Definition of Done para la Iteracion 1

Una historia se considerara terminada cuando:

- Cumpla todos sus criterios de aceptacion.
- Este documentada en el repositorio.
- Tenga validaciones basicas definidas.
- Respete las decisiones del cliente.
- No contradiga la regla de pago contra entrega.
- Mantenga una solucion simple y util para la primera entrega.
