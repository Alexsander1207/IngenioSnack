# Registro de Refactorizacion

**Proyecto:** IngenioSnack
**Practica XP - IS055B**

En XP refactorizamos de forma continua: mejoramos el diseno del codigo sin cambiar su
comportamiento, siempre con las pruebas en verde. Este documento registra cada refactor
significativo (paso "Refactor" del ciclo TDD: Red -> Green -> Refactor).

---

## R1 — Calculo de subtotal y total (Dia 1-2)

| Campo                 | Detalle                                                    |
|-----------------------|------------------------------------------------------------|
| Fecha                 | 09/06/2026                                                 |
| Archivo(s)            | `ItemPedido.js`, `Pedido.js`                               |
| Code smell detectado  | Calculo de totales duplicado en varios lugares             |
| Tecnica aplicada      | Extraer logica a getters `subtotal` y `total` (Extract Method) |
| Pruebas antes/despues | Verdes antes y despues                                     |

### Antes

```js
// Calculo disperso, sin encapsular
let total = 0;
for (let i = 0; i < items.length; i++) {
  total = total + items[i].producto.precio * items[i].cantidad;
}
```

### Despues

```js
// ItemPedido.js
get subtotal() {
  return this.producto.precio * this.cantidad;
}

// Pedido.js
get total() {
  return this.items.reduce((acc, item) => acc + item.subtotal, 0);
}
```

---

## R2 — Validacion de productos en pedidoService (Dia 3)

| Campo                 | Detalle                                                    |
|-----------------------|------------------------------------------------------------|
| Fecha                 | 09/06/2026                                                 |
| Archivo(s)            | `pedidoService.js`                                         |
| Code smell detectado  | Validaciones mezcladas con la creacion del pedido          |
| Tecnica aplicada      | Centralizar busqueda en `menuService.obtenerProducto`      |
| Pruebas antes/despues | Verdes antes y despues                                     |

### Antes

```js
// Busqueda duplicada dentro de crearPedido
function crearPedido(estudianteId, lineas) {
  const items = [];
  for (const linea of lineas) {
    let encontrado = null;
    for (const p of db.productos) {
      if (p.id === linea.productoId) encontrado = p;
    }
    if (!encontrado) throw new Error('Producto no encontrado');
    items.push(new ItemPedido(encontrado, linea.cantidad));
  }
  // ...
}
```

### Despues

```js
// Delegacion limpia a menuService
function crearPedido(estudianteId, lineas) {
  const items = lineas.map(({ productoId, cantidad }) => {
    const producto = menuService.obtenerProducto(productoId);
    if (!producto) throw new Error(`Producto no encontrado: ${productoId}`);
    if (!producto.disponible) throw new Error(`Producto no disponible: ${producto.nombre}`);
    return new ItemPedido(producto, cantidad);
  });
  // ...
}
```

---

## R3 — Funcion calcularTotalPedido con reduce (Dia 4)

| Campo                 | Detalle                                                    |
|-----------------------|------------------------------------------------------------|
| Fecha                 | 09/06/2026                                                 |
| Archivo(s)            | `pedidoService.js`                                         |
| Code smell detectado  | Bucle `for` imperativo para sumar totales (codigo verboso) |
| Tecnica aplicada      | Reemplazar bucle por `Array.reduce` (Replace Loop with Pipeline) |
| Pruebas antes/despues | Verdes antes y despues                                     |

### Antes

```js
function total(p) {
  let t = 0;
  for (let i = 0; i < p.length; i++) {
    t = t + p[i].precio * p[i].cantidad;
  }
  return t;
}
```

### Despues

```js
function calcularTotalPedido(itemsPedido) {
  return itemsPedido.reduce((total, item) => {
    return total + item.precioUnitario * item.cantidad;
  }, 0);
}
```

**Mejora:** nombre descriptivo, sin variable auxiliar mutable, expresion declarativa.

---

## R4 — Separacion de validacion en funcion explicita (Dia 4)

| Campo                 | Detalle                                                            |
|-----------------------|--------------------------------------------------------------------|
| Fecha                 | 09/06/2026                                                         |
| Archivo(s)            | `pedidoService.js`                                                 |
| Code smell detectado  | Logica de validacion embebida dentro de `crearPedido` (funcion larga) |
| Tecnica aplicada      | Extract Method — extraer `validarDisponibilidadPedido`             |
| Pruebas antes/despues | Verdes antes y despues                                             |

### Antes

```js
// Toda la validacion adentro de crearPedido — dificil de testear aislada
function crearPedido(estudianteId, lineas) {
  const items = lineas.map(({ productoId, cantidad }) => {
    const producto = menuService.obtenerProducto(productoId);
    if (!producto) throw new Error(`Producto no encontrado: ${productoId}`);
    if (!producto.disponible) throw new Error(`Producto no disponible`);
    // ...
  });
}
```

### Despues

```js
// Validacion extraida, testeable de forma independiente
function validarDisponibilidadPedido(pedido) {
  const hayNoDisponible = pedido.items.some(
    (item) => item.producto.disponible === false
  );
  if (hayNoDisponible) {
    return { valido: false, mensaje: 'El pedido contiene productos no disponibles' };
  }
  return { valido: true, mensaje: 'Todos los productos estan disponibles' };
}

function confirmarPedido(pedidoId) {
  const pedido = obtenerPedido(pedidoId);
  const validacion = validarDisponibilidadPedido({
    items: pedido.items.map((item) => ({ producto: item.producto })),
  });
  if (!validacion.valido) throw new Error(validacion.mensaje);
  pedido.estado = ESTADOS.CONFIRMADO;
  return pedido;
}
```
