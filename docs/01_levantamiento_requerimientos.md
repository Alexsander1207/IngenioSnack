# 01. Levantamiento de requerimientos - IngenioSnack

## 1. Contexto del negocio

La cafeteria **IngenioSnack** atiende a estudiantes de la Facultad de Ingenieria de Sistemas de la UNCP. Durante el recreo de una hora se forman filas extensas porque los estudiantes compran sandwiches, cafe y snacks al mismo tiempo. Esto genera tres problemas principales:

- Los estudiantes pierden tiempo de almuerzo.
- Algunos estudiantes llegan tarde a la siguiente clase.
- La cafeteria pierde ventas porque varios estudiantes se retiran a otras cafeterias.

El Sr. Julio, propietario de la cafeteria, actualmente controla los pedidos y productos con una libreta fisica. El cliente solicita una solucion simple, rapida y facil de usar desde celular.

## 2. Tecnicas de levantamiento aplicadas

### 2.1 Entrevista con el cliente

Se tomo como fuente principal la conversacion inicial con el Sr. Julio. Esta tecnica permite identificar necesidades directas, restricciones y prioridades desde la voz del cliente.

### 2.2 Analisis de ambiguedades

Se identificaron frases del cliente que requieren interpretacion para poder convertirlas en requerimientos verificables.

### 2.3 Priorizacion XP

Se aplico el enfoque de **Planning Game**, priorizando las historias que entregan mayor valor en la primera iteracion y evitando funcionalidades innecesarias.

## 3. Stakeholders identificados

| Stakeholder | Rol dentro del caso | Necesidad principal |
|---|---|---|
| Sr. Julio | Cliente / dueno de IngenioSnack | Reducir filas, no perder ventas y gestionar productos rapidamente |
| Estudiante | Usuario final | Pedir anticipadamente y recoger sin esperar demasiado |
| Personal de atencion | Apoyo operativo | Preparar pedidos en orden y evitar confusiones |
| Equipo de desarrollo | Equipo XP | Entregar una primera version simple y funcional |
| Facultad / entorno universitario | Contexto externo | Reducir retrasos y aglomeraciones en horario de recreo |

## 4. Requerimientos funcionales

| Codigo | Requerimiento funcional | Prioridad | Origen |
|---|---|---|---|
| RF-01 | El sistema debe permitir que el estudiante se identifique para realizar pedidos. | Alta | Cliente: alumnos piden desde celular |
| RF-02 | El sistema debe mostrar el menu disponible de productos. | Alta | Cliente: sandwiches, cafe o snack |
| RF-03 | El sistema debe permitir realizar pedidos anticipados desde celular. | Alta | Cliente: pedir antes de que termine la clase |
| RF-04 | El sistema debe permitir confirmar el pedido para recojo. | Alta | Cliente: que bajen, recojan y se vayan |
| RF-05 | El sistema debe validar disponibilidad de productos o ingredientes antes de confirmar. | Alta | Cliente: si ya no hay ingredientes, avisar al toque |
| RF-06 | El sistema debe permitir al Sr. Julio activar o desactivar productos del menu rapidamente. | Alta | Cliente: quitar o poner productos del menu en un segundo |
| RF-07 | El sistema debe registrar compras de sandwiches por estudiante para el beneficio de fidelidad. | Media | Cliente: cafe americano gratis cada 10 sandwiches |
| RF-08 | El sistema debe otorgar un cafe americano gratis cada 10 sandwiches comprados. | Media | Cliente: premio a clientes fieles |
| RF-09 | El sistema debe mostrar al Sr. Julio los productos mas vendidos. | Media | Cliente: ver que se vende mas en dias de examen |
| RF-10 | El sistema debe permitir marcar un pedido como entregado y pagado contra entrega. | Alta | Cliente: pago contra entrega al recoger |

## 5. Requerimientos no funcionales

| Codigo | Requerimiento no funcional | Prioridad | Justificacion |
|---|---|---|---|
| RNF-01 | El sistema debe ser simple y facil de usar desde celular. | Alta | El cliente no desea un sistema complicado |
| RNF-02 | Las acciones principales deben realizarse en pocos pasos. | Alta | El contexto de uso ocurre durante recreos cortos |
| RNF-03 | La disponibilidad de productos debe actualizarse de forma inmediata. | Alta | Evita pedidos de productos sin ingredientes |
| RNF-04 | El sistema debe mostrar mensajes claros cuando un producto no este disponible. | Alta | Reduce frustracion del estudiante |
| RNF-05 | La interfaz del cliente debe ser entendible para una persona no tecnica. | Alta | El Sr. Julio no domina sistemas |
| RNF-06 | El sistema debe funcionar correctamente en celulares. | Alta | Los estudiantes pediran desde su celular |
| RNF-07 | El sistema no debe incluir pasarela bancaria en esta primera iteracion. | Alta | El cliente pidio pago contra entrega |

## 6. Reglas de negocio

| Codigo | Regla de negocio | Prioridad |
|---|---|---|
| RN-01 | Un pedido solo puede confirmarse si los productos estan disponibles. | Alta |
| RN-02 | El pago se realiza contra entrega, no en linea. | Alta |
| RN-03 | El beneficio de fidelidad aplica solo por sandwiches comprados. | Media |
| RN-04 | El premio de fidelidad sera un cafe americano gratis. | Media |
| RN-05 | Cada 10 sandwiches comprados y entregados se genera un beneficio. | Media |
| RN-06 | Los productos desactivados por el Sr. Julio no deben mostrarse como disponibles al estudiante. | Alta |
| RN-07 | Solo el Sr. Julio o personal autorizado puede modificar la disponibilidad del menu. | Alta |

## 7. Restricciones de la primera iteracion

- No se implementara pago con tarjeta, Yape, Plin ni pasarela bancaria.
- No se implementara delivery.
- No se implementara gestion avanzada de proveedores.
- No se implementara inventario completo por insumos en esta primera version.
- No se disenara una solucion a largo plazo de cinco anos; se prioriza lo minimo necesario para resolver la fila.

## 8. Ambiguedades y decisiones del equipo

| Ambiguedad detectada | Decision tomada | Justificacion |
|---|---|---|
| No se indico como identificar al estudiante. | Se usara correo institucional o codigo universitario. | Permite asociar pedidos y fidelidad sin crear un sistema complejo. |
| No se aclaro si el cafe gratis podia ser cualquier cafe. | Se define cafe americano gratis. | Es exactamente el producto mencionado por el cliente. |
| No se explico si los sandwiches cancelados cuentan para fidelidad. | Solo cuentan pedidos entregados y pagados. | Evita beneficios por pedidos no concretados. |
| No se aclaro si el Sr. Julio gestiona ingredientes o productos. | En Iteracion 1 solo activara o desactivara productos del menu. | Mantiene simplicidad XP. |
| No se indico si se necesita pago digital. | No se incluye pago digital. | El cliente solicito pago contra entrega. |

## 9. Criterios globales de aceptacion

- El estudiante debe poder revisar el menu desde celular.
- El estudiante debe poder realizar un pedido anticipado.
- El sistema debe impedir confirmar pedidos sin disponibilidad.
- El Sr. Julio debe poder cambiar disponibilidad de productos rapidamente.
- El pedido debe quedar registrado para recojo y pago contra entrega.
- Las funcionalidades de la Iteracion 1 deben mantenerse simples y coherentes con XP.
