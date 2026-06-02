# 06. Diagrama de flujo - Pedir y recoger

Este diagrama representa el flujo principal de la primera iteracion XP para el caso **IngenioSnack**.

## Flujo principal

```mermaid
flowchart TD
    A[Estudiante ingresa desde celular] --> B[Se identifica]
    B --> C[Consulta menu disponible]
    C --> D[Selecciona productos]
    D --> E[Revisa resumen del pedido]
    E --> F{Producto disponible?}
    F -- No --> G[Sistema avisa producto no disponible]
    G --> C
    F -- Si --> H[Confirma pedido anticipado]
    H --> I[Pedido queda pendiente de preparacion]
    I --> J[Sr. Julio visualiza pedido]
    J --> K[Prepara pedido]
    K --> L[Estudiante recoge pedido]
    L --> M[Pago contra entrega]
    M --> N[Pedido entregado]
```

## Relacion con historias de usuario

| Paso del flujo | Historia relacionada |
|---|---|
| Identificacion del estudiante | HU-01 |
| Consulta de menu | HU-02 |
| Seleccion y confirmacion de pedido | HU-03 |
| Validacion de disponibilidad | HU-04 |
| Gestion del menu disponible | HU-05 |
| Pago contra entrega | HU-06 |

## Justificacion XP

El flujo se mantiene simple porque responde directamente al problema principal del cliente: reducir filas durante el recreo. No se agregan pasos de pago digital, delivery, inventario avanzado ni analitica compleja en esta primera iteracion.
