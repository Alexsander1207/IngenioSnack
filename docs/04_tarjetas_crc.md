# 04. Tarjetas CRC - Flujo Pedir y Recoger

Las tarjetas CRC permiten representar de forma simple las clases principales del sistema, sus responsabilidades y sus colaboradores. Se aplican dentro del enfoque de **diseno simple** de XP.

## CRC-01 - Estudiante

| Elemento | Descripcion |
|---|---|
| Clase | Estudiante |
| Responsabilidad principal | Identificarse y realizar pedidos anticipados desde celular. |
| Colaboradores | Pedido, Producto, BeneficioFidelidad |

### Responsabilidades

- Ingresar codigo universitario o correo institucional.
- Consultar el menu disponible.
- Seleccionar productos para su pedido.
- Confirmar pedido anticipado.
- Acumular sandwiches comprados para fidelidad.

### Colaboradores

- **Pedido:** registra los productos solicitados por el estudiante.
- **Producto:** permite consultar productos disponibles.
- **BeneficioFidelidad:** almacena el avance hacia el cafe gratis.

---

## CRC-02 - Producto

| Elemento | Descripcion |
|---|---|
| Clase | Producto |
| Responsabilidad principal | Representar los alimentos o bebidas ofrecidos por IngenioSnack. |
| Colaboradores | Pedido, Menu, SrJulio |

### Responsabilidades

- Guardar nombre, categoria y precio.
- Indicar si esta disponible o no disponible.
- Ser mostrado en el menu cuando este activo.
- Impedir pedidos cuando no este disponible.

### Colaboradores

- **Menu:** agrupa los productos visibles para el estudiante.
- **Pedido:** usa productos para formar la solicitud del estudiante.
- **SrJulio:** modifica la disponibilidad del producto.

---

## CRC-03 - Pedido

| Elemento | Descripcion |
|---|---|
| Clase | Pedido |
| Responsabilidad principal | Registrar la solicitud anticipada del estudiante para su recojo. |
| Colaboradores | Estudiante, Producto, SrJulio |

### Responsabilidades

- Asociar un pedido a un estudiante.
- Guardar productos seleccionados.
- Validar disponibilidad antes de confirmar.
- Registrar estado del pedido.
- Indicar que el pago sera contra entrega.

### Estados sugeridos

- Pendiente de preparacion.
- Listo para recoger.
- Entregado.
- Cancelado.

### Colaboradores

- **Estudiante:** crea el pedido.
- **Producto:** compone el contenido del pedido.
- **SrJulio:** prepara, entrega o actualiza el estado del pedido.

---

## CRC-04 - SrJulio

| Elemento | Descripcion |
|---|---|
| Clase | SrJulio |
| Responsabilidad principal | Administrar disponibilidad de productos y controlar pedidos de la cafeteria. |
| Colaboradores | Producto, Pedido, ReporteVentas |

### Responsabilidades

- Activar o desactivar productos del menu.
- Revisar pedidos recibidos.
- Marcar pedidos como listos o entregados.
- Confirmar pago contra entrega.
- Revisar productos mas vendidos en futuras iteraciones.

### Colaboradores

- **Producto:** actualiza su disponibilidad.
- **Pedido:** cambia el estado de atencion.
- **ReporteVentas:** consulta ventas en una futura iteracion.

---

## CRC-05 - BeneficioFidelidad

| Elemento | Descripcion |
|---|---|
| Clase | BeneficioFidelidad |
| Responsabilidad principal | Controlar el beneficio del cafe americano gratis por compras de sandwiches. |
| Colaboradores | Estudiante, Pedido, Producto |

### Responsabilidades

- Contar sandwiches entregados y pagados.
- Generar beneficio al llegar a 10 sandwiches.
- Registrar si el beneficio fue canjeado.
- Reiniciar contador despues del canje.

### Colaboradores

- **Estudiante:** acumula el beneficio.
- **Pedido:** confirma compras validas.
- **Producto:** permite distinguir sandwiches de otros productos.

---

## Resumen de clases principales

| Clase | Responsabilidad clave | Iteracion |
|---|---|---|
| Estudiante | Identificacion y pedido anticipado | Iteracion 1 |
| Producto | Disponibilidad y datos del menu | Iteracion 1 |
| Pedido | Registro de solicitud para recojo | Iteracion 1 |
| SrJulio | Gestion de disponibilidad y atencion | Iteracion 1 |
| BeneficioFidelidad | Cafe gratis por 10 sandwiches | Iteracion futura |

## Justificacion de diseno simple

El diseno se mantiene reducido a las clases necesarias para el flujo principal de **pedir y recoger**. No se agregan clases para pasarela de pago, delivery, proveedores o inventario avanzado porque no forman parte del alcance de la primera iteracion.
