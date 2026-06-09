# Registro de Refactorizacion

**Proyecto:** IngenioSnack
**Practica XP - IS055B**

En XP refactorizamos de forma continua: mejoramos el diseno del codigo sin cambiar su
comportamiento, siempre con las pruebas en verde. Este documento registra cada refactor
significativo (paso "Refactor" del ciclo TDD: Red -> Green -> Refactor).

## Plantilla

| Campo                | Detalle |
|----------------------|---------|
| Fecha                |         |
| Archivo(s)           |         |
| Code smell detectado |         |
| Tecnica aplicada     |         |
| Pruebas antes/despues|         |

---

## Refactors aplicados

### R1 - Calculo de subtotal y total
| Campo                | Detalle |
|----------------------|---------|
| Fecha                | TBD     |
| Archivo(s)           | `ItemPedido.js`, `Pedido.js` |
| Code smell detectado | Calculo de totales duplicado en varios lugares |
| Tecnica aplicada     | Extraer logica a getters `subtotal` y `total` (Extract Method) |
| Pruebas antes/despues| Verdes antes y despues |

### R2 - Validacion de productos en pedidoService
| Campo                | Detalle |
|----------------------|---------|
| Fecha                | TBD     |
| Archivo(s)           | `pedidoService.js` |
| Code smell detectado | Validaciones mezcladas con la creacion del pedido |
| Tecnica aplicada     | Centralizar busqueda en `menuService.obtenerProducto` |
| Pruebas antes/despues| Verdes antes y despues |
