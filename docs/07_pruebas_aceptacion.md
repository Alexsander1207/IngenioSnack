# 07. Pruebas de aceptacion

Las pruebas de aceptacion permiten validar si una historia de usuario cumple con lo solicitado por el cliente. En XP, estas pruebas ayudan a confirmar que la funcionalidad entrega valor real.

## HU-01 - Identificacion del estudiante

| Caso | Dado | Cuando | Entonces |
|---|---|---|---|
| PA-01 | El estudiante ingresa al sistema | Escribe un identificador valido | El sistema permite continuar al menu |
| PA-02 | El estudiante ingresa al sistema | Deja vacio el identificador | El sistema muestra un mensaje de validacion |
| PA-03 | El estudiante ya tiene pedidos previos | Ingresa su identificador | El sistema asocia el nuevo pedido al mismo estudiante |

## HU-02 - Consulta de menu disponible

| Caso | Dado | Cuando | Entonces |
|---|---|---|---|
| PA-04 | Existen productos activos | El estudiante abre el menu | El sistema muestra nombre, categoria y precio |
| PA-05 | Un producto fue desactivado | El estudiante consulta el menu | El producto no aparece como disponible |
| PA-06 | No hay productos disponibles | El estudiante consulta el menu | El sistema muestra un mensaje claro |

## HU-03 - Pedido anticipado desde celular

| Caso | Dado | Cuando | Entonces |
|---|---|---|---|
| PA-07 | El estudiante esta identificado | Selecciona productos disponibles | El sistema muestra el resumen del pedido |
| PA-08 | El estudiante revisa el resumen | Confirma el pedido | El sistema registra el pedido como pendiente de preparacion |
| PA-09 | El pedido fue registrado | El sistema confirma la accion | Se muestra mensaje indicando pago contra entrega |

## HU-04 - Validacion de disponibilidad

| Caso | Dado | Cuando | Entonces |
|---|---|---|---|
| PA-10 | El producto esta disponible | El estudiante confirma pedido | El pedido se registra correctamente |
| PA-11 | El producto fue marcado no disponible | El estudiante intenta confirmarlo | El sistema bloquea el pedido |
| PA-12 | El pedido contiene un producto no disponible | El estudiante confirma | El sistema solicita elegir otra opcion |

## HU-05 - Gestion rapida de disponibilidad

| Caso | Dado | Cuando | Entonces |
|---|---|---|---|
| PA-13 | Sr. Julio accede a gestion de menu | Desactiva un producto | El producto deja de mostrarse como disponible |
| PA-14 | Sr. Julio accede a gestion de menu | Activa un producto | El producto vuelve a mostrarse en el menu |
| PA-15 | Un producto se desactiva | Un estudiante intenta pedirlo | El sistema impide agregarlo al pedido |

## Criterio general de aprobacion

La Iteracion 1 se considera aceptada si las historias seleccionadas cumplen sus pruebas principales y permiten ejecutar el flujo minimo:

1. Identificarse.
2. Consultar menu.
3. Seleccionar productos.
4. Validar disponibilidad.
5. Confirmar pedido anticipado.
6. Permitir al Sr. Julio modificar disponibilidad.
