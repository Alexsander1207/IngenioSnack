# IngenioSnack - Practica Semana 09

Repositorio academico para la practica de la asignatura **Metodologia de Desarrollo de Software (IS055B)**, Unidad II: **Metodologia XP**.

## Caso de estudio

**IngenioSnack** es una cafeteria ubicada al costado de los laboratorios de la Facultad de Ingenieria de Sistemas de la UNCP. El problema principal es la acumulacion de estudiantes durante el recreo, lo que genera filas largas, perdida de tiempo, retrasos a clase y perdida de ventas para el negocio.

El cliente, el Sr. Julio, solicita una solucion web/movil simple que permita a los estudiantes realizar pedidos desde su celular antes de salir de clase, recogerlos rapidamente y pagar contra entrega.

## Objetivo de la practica

Aplicar practicas iniciales de **Extreme Programming (XP)** para:

- Levantar requerimientos desde la conversacion con el cliente.
- Identificar ambiguedades y tomar decisiones justificadas.
- Redactar historias de usuario con criterios de aceptacion.
- Estimar esfuerzo usando Planning Poker con Fibonacci.
- Seleccionar el alcance de la Iteracion 1 con una capacidad maxima de 20 puntos.
- Elaborar tarjetas CRC para el flujo principal de pedir y recoger.

## Contenido del repositorio

```text
IngenioSnack/
├── README.md
├── docs/
│   ├── 01_levantamiento_requerimientos.md
│   ├── 02_historias_usuario.md
│   ├── 03_backlog_iteracion_1.md
│   ├── 04_tarjetas_crc.md
│   └── 05_evidencia_github.md
└── .github/
    └── ISSUE_TEMPLATE/
        └── historia_usuario.md
```

## Enfoque XP aplicado

El trabajo se centra en el **Planning Game inicial**. Se prioriza la comunicacion con el cliente, la simplicidad, el valor de negocio y la entrega incremental. No se incluyen funcionalidades que el cliente no solicito para esta iteracion, como pasarelas de pago, delivery o sistemas complejos de inventario.

## Alcance de la Iteracion 1

La Iteracion 1 tiene una capacidad maxima de **20 puntos de historia**. Por ello, se priorizan las funcionalidades esenciales para resolver el problema principal:

1. Registro e identificacion del estudiante.
2. Consulta del menu disponible.
3. Registro de pedido anticipado.
4. Validacion de disponibilidad de ingredientes.
5. Gestion rapida de disponibilidad de productos por parte del Sr. Julio.

## Decisiones relevantes

- El pago sera **contra entrega**, como indico el cliente.
- No se implementa Yape, Plin ni tarjeta en esta primera iteracion.
- El cafe gratis sera **cafe americano**, por ser la recompensa mencionada por el cliente.
- El sistema identificara al estudiante mediante correo institucional o codigo universitario.
- Si no hay ingredientes disponibles, el sistema debe avisar antes de confirmar el pedido.

## Integrantes

- Integrante 1: ____________________
- Integrante 2: ____________________
- Integrante 3: ____________________
- Integrante 4: ____________________

## Estado

Practica desarrollada para entrega academica en ADESA y evidencia en GitHub.
