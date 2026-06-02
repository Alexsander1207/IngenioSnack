# 02. Historias de usuario - IngenioSnack

## Formato utilizado

Cada historia de usuario se redacta con el formato XP:

> Como [rol], quiero [funcionalidad], para [beneficio].

Ademas, se agregan criterios de aceptacion, prioridad, estimacion con Fibonacci y notas de conversacion para resolver ambiguedades del cliente.

---

## HU-01 - Identificacion del estudiante

**Rol:** Estudiante  
**Quiero:** identificarme con mi codigo universitario o correo institucional  
**Para:** realizar pedidos y acumular beneficios de fidelidad.

### Historia

Como estudiante, quiero identificarme con mi codigo universitario o correo institucional, para realizar pedidos anticipados y acumular correctamente mis compras de sandwiches.

### Criterios de aceptacion

- CA-01: El sistema debe permitir ingresar codigo universitario o correo institucional.
- CA-02: El sistema debe validar que el campo de identificacion no este vacio.
- CA-03: Si el estudiante ya existe, el sistema debe asociar el pedido a su cuenta.
- CA-04: Si es un estudiante nuevo, el sistema debe crear un registro basico.
- CA-05: El sistema debe usar esta identificacion para contar sandwiches comprados.

### Prioridad

Alta

### Estimacion

3 puntos

### Notas y conversaciones

El cliente no especifico como identificar a los estudiantes. El equipo decide usar codigo universitario o correo institucional porque es simple, verificable y suficiente para la primera iteracion.

---

## HU-02 - Consulta de menu disponible

**Rol:** Estudiante  
**Quiero:** ver el menu actualizado desde mi celular  
**Para:** elegir productos disponibles antes de bajar a la cafeteria.

### Historia

Como estudiante, quiero ver el menu actualizado desde mi celular, para elegir sandwiches, cafe o snacks que realmente esten disponibles.

### Criterios de aceptacion

- CA-01: El sistema debe mostrar una lista de productos disponibles.
- CA-02: Cada producto debe mostrar nombre, categoria y precio.
- CA-03: Los productos desactivados por el Sr. Julio no deben mostrarse como disponibles.
- CA-04: El menu debe poder consultarse desde celular.
- CA-05: Si no hay productos disponibles, el sistema debe mostrar un mensaje claro.

### Prioridad

Alta

### Estimacion

3 puntos

### Notas y conversaciones

El menu debe ser simple. No se agregan filtros avanzados ni recomendaciones automaticas en esta iteracion.

---

## HU-03 - Pedido anticipado desde celular

**Rol:** Estudiante  
**Quiero:** realizar un pedido desde mi celular antes de terminar la clase  
**Para:** recogerlo rapidamente durante el recreo.

### Historia

Como estudiante, quiero realizar un pedido desde mi celular antes de terminar la clase, para recoger mi sandwich, cafe o snack sin perder tiempo en la fila.

### Criterios de aceptacion

- CA-01: El estudiante debe poder seleccionar uno o mas productos disponibles.
- CA-02: El sistema debe mostrar el resumen del pedido antes de confirmarlo.
- CA-03: El sistema debe registrar fecha, hora, estudiante y productos solicitados.
- CA-04: El sistema debe generar un estado inicial: Pendiente de preparacion.
- CA-05: El sistema debe mostrar un mensaje de pedido registrado correctamente.
- CA-06: El sistema debe indicar que el pago sera contra entrega.

### Prioridad

Alta

### Estimacion

5 puntos

### Notas y conversaciones

El pedido anticipado es el nucleo del problema. Permite reducir filas y preparar productos antes de que los estudiantes lleguen.

---

## HU-04 - Validacion de disponibilidad antes de confirmar pedido

**Rol:** Estudiante  
**Quiero:** recibir un aviso inmediato si un producto ya no esta disponible  
**Para:** elegir otra opcion antes de confirmar mi pedido.

### Historia

Como estudiante, quiero recibir un aviso inmediato si un producto ya no esta disponible, para cambiar mi pedido sin perder tiempo.

### Criterios de aceptacion

- CA-01: El sistema debe verificar disponibilidad antes de confirmar el pedido.
- CA-02: Si un producto no esta disponible, el sistema debe impedir la confirmacion.
- CA-03: El sistema debe mostrar un mensaje indicando que el producto debe cambiarse.
- CA-04: El estudiante debe poder volver al menu para elegir otro producto.
- CA-05: El pedido solo debe registrarse si todos los productos seleccionados estan disponibles.

### Prioridad

Alta

### Estimacion

5 puntos

### Notas y conversaciones

El cliente indico que, si no hay ingredientes, el sistema debe avisar al estudiante. Para mantener simplicidad, en la Iteracion 1 se validara disponibilidad del producto, no inventario detallado por ingrediente.

---

## HU-05 - Gestion rapida de disponibilidad de productos

**Rol:** Sr. Julio  
**Quiero:** activar o desactivar productos del menu rapidamente  
**Para:** evitar que los estudiantes pidan productos que no puedo preparar.

### Historia

Como Sr. Julio, quiero activar o desactivar productos del menu rapidamente, para actualizar la oferta cuando falte pan, ingredientes o algun producto.

### Criterios de aceptacion

- CA-01: El sistema debe mostrar al Sr. Julio una lista de productos del menu.
- CA-02: Cada producto debe tener una opcion para marcarlo como disponible o no disponible.
- CA-03: El cambio de disponibilidad debe reflejarse inmediatamente en el menu del estudiante.
- CA-04: Los productos no disponibles no deben poder agregarse a nuevos pedidos.
- CA-05: La accion debe poder hacerse desde celular.

### Prioridad

Alta

### Estimacion

4 puntos

### Notas y conversaciones

El cliente pidio poder quitar o poner productos del menu en un segundo. Para la primera iteracion se implementa disponibilidad por producto, no gestion completa de inventario.

---

## HU-06 - Pago contra entrega

**Rol:** Sr. Julio  
**Quiero:** marcar un pedido como entregado y pagado al momento del recojo  
**Para:** controlar los pedidos finalizados sin usar bancos ni pagos digitales.

### Historia

Como Sr. Julio, quiero marcar un pedido como entregado y pagado al momento del recojo, para cerrar correctamente la venta sin complicarme con pasarelas bancarias.

### Criterios de aceptacion

- CA-01: El sistema debe mostrar los pedidos pendientes de recojo.
- CA-02: El Sr. Julio debe poder marcar un pedido como entregado.
- CA-03: Al marcarlo como entregado, el sistema debe registrar que fue pagado contra entrega.
- CA-04: Solo los pedidos entregados y pagados deben contar para fidelidad.
- CA-05: El sistema no debe solicitar datos de tarjeta, banco, Yape ni Plin en esta iteracion.

### Prioridad

Alta

### Estimacion

3 puntos

### Notas y conversaciones

El cliente aclaro que no desea complicarse con bancos. Por ello, la solucion se limita a pago contra entrega.

---

## HU-07 - Registro de compras para fidelidad

**Rol:** Estudiante  
**Quiero:** que el sistema cuente mis sandwiches comprados  
**Para:** recibir un cafe americano gratis cada 10 sandwiches.

### Historia

Como estudiante, quiero que el sistema cuente mis sandwiches comprados, para obtener un cafe americano gratis cuando complete 10 compras validas.

### Criterios de aceptacion

- CA-01: El sistema debe contar solo sandwiches entregados y pagados.
- CA-02: El contador debe asociarse al estudiante identificado.
- CA-03: Snacks, cafes u otros productos no deben sumar al contador de sandwiches.
- CA-04: Al llegar a 10 sandwiches, el sistema debe generar un beneficio de cafe americano gratis.
- CA-05: Despues de canjear el beneficio, el contador debe reiniciarse para el siguiente ciclo.

### Prioridad

Media

### Estimacion

5 puntos

### Notas y conversaciones

El cliente no aclaro si el beneficio aplicaba a cualquier cafe. Se decide que sera cafe americano gratis porque fue lo mencionado expresamente.

---

## HU-08 - Visualizacion de productos mas vendidos

**Rol:** Sr. Julio  
**Quiero:** ver que productos se venden mas  
**Para:** preparar mejor el stock en dias de mayor demanda como examenes.

### Historia

Como Sr. Julio, quiero ver los productos mas vendidos, para preparar mas cantidad de los productos con mayor demanda en dias de examen.

### Criterios de aceptacion

- CA-01: El sistema debe mostrar un resumen de productos vendidos.
- CA-02: El resumen debe considerar solo pedidos entregados y pagados.
- CA-03: El Sr. Julio debe poder ver cantidad vendida por producto.
- CA-04: El sistema debe permitir revisar ventas por fecha.
- CA-05: La informacion debe visualizarse desde celular.

### Prioridad

Media

### Estimacion

5 puntos

### Notas y conversaciones

Aunque es importante para el negocio, no resuelve directamente la fila. Por eso se deja fuera de la Iteracion 1 si la capacidad no alcanza.

---

## HU-09 - Lista de pedidos pendientes

**Rol:** Sr. Julio  
**Quiero:** ver los pedidos pendientes de preparacion y recojo  
**Para:** organizar la atencion durante el recreo.

### Historia

Como Sr. Julio, quiero ver los pedidos pendientes de preparacion y recojo, para atender primero los pedidos anticipados y reducir desorden en la cafeteria.

### Criterios de aceptacion

- CA-01: El sistema debe listar pedidos pendientes.
- CA-02: Cada pedido debe mostrar estudiante, productos, total y hora de registro.
- CA-03: El sistema debe diferenciar pedidos pendientes, listos y entregados.
- CA-04: El Sr. Julio debe poder cambiar el estado del pedido.
- CA-05: La lista debe ser visible desde celular o laptop.

### Prioridad

Alta

### Estimacion

5 puntos

### Notas y conversaciones

Esta historia complementa el pedido anticipado. Puede entrar en Iteracion 1 si se ajusta la capacidad o se divide en una version mas simple.

---

## Resumen de historias

| ID | Historia | Prioridad | Estimacion |
|---|---|---:|---:|
| HU-01 | Identificacion del estudiante | Alta | 3 |
| HU-02 | Consulta de menu disponible | Alta | 3 |
| HU-03 | Pedido anticipado desde celular | Alta | 5 |
| HU-04 | Validacion de disponibilidad | Alta | 5 |
| HU-05 | Gestion rapida de disponibilidad | Alta | 4 |
| HU-06 | Pago contra entrega | Alta | 3 |
| HU-07 | Registro de compras para fidelidad | Media | 5 |
| HU-08 | Productos mas vendidos | Media | 5 |
| HU-09 | Lista de pedidos pendientes | Alta | 5 |
