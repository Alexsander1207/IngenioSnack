# 05. Evidencia de actividades en GitHub

Este documento organiza las actividades solicitadas en la practica para que el repositorio tenga evidencia clara de trabajo.

## 1. Extraccion de historias de usuario

Se identificaron 9 historias de usuario a partir de la conversacion con el cliente:

| ID | Historia | Estado |
|---|---|---|
| HU-01 | Identificacion del estudiante | Documentada |
| HU-02 | Consulta de menu disponible | Documentada |
| HU-03 | Pedido anticipado desde celular | Documentada |
| HU-04 | Validacion de disponibilidad | Documentada |
| HU-05 | Gestion rapida de disponibilidad | Documentada |
| HU-06 | Pago contra entrega | Documentada |
| HU-07 | Registro de compras para fidelidad | Documentada |
| HU-08 | Visualizacion de productos mas vendidos | Documentada |
| HU-09 | Lista de pedidos pendientes | Documentada |

Ubicacion: `docs/02_historias_usuario.md`

## 2. Notas y conversaciones

Las ambiguedades del cliente fueron resueltas en la seccion de notas de cada historia y en el levantamiento de requerimientos.

Principales decisiones:

- El estudiante se identifica con codigo universitario o correo institucional.
- El cafe gratis sera cafe americano.
- Solo cuentan para fidelidad los sandwiches entregados y pagados.
- La Iteracion 1 valida disponibilidad por producto, no inventario por ingrediente.
- No se implementa pago digital.

Ubicacion: `docs/01_levantamiento_requerimientos.md` y `docs/02_historias_usuario.md`

## 3. Estimacion agil con Planning Poker

Se uso la secuencia Fibonacci:

```text
1, 2, 3, 5, 8, 13
```

Resumen:

| ID | Historia | Puntos |
|---|---|---:|
| HU-01 | Identificacion del estudiante | 3 |
| HU-02 | Consulta de menu disponible | 3 |
| HU-03 | Pedido anticipado desde celular | 5 |
| HU-04 | Validacion de disponibilidad | 5 |
| HU-05 | Gestion rapida de disponibilidad | 4 |
| HU-06 | Pago contra entrega | 3 |
| HU-07 | Registro de compras para fidelidad | 5 |
| HU-08 | Productos mas vendidos | 5 |
| HU-09 | Lista de pedidos pendientes | 5 |

Ubicacion: `docs/03_backlog_iteracion_1.md`

## 4. Seleccion de Iteracion 1

La capacidad definida fue de **20 puntos**. Las historias seleccionadas fueron:

| ID | Historia | Puntos |
|---|---|---:|
| HU-02 | Consulta de menu disponible | 3 |
| HU-03 | Pedido anticipado desde celular | 5 |
| HU-04 | Validacion de disponibilidad | 5 |
| HU-05 | Gestion rapida de disponibilidad | 4 |
| HU-01 | Identificacion del estudiante | 3 |
| **Total** |  | **20** |

## 5. Diseno simple con tarjetas CRC

Se elaboraron 5 tarjetas CRC, superando el minimo de 3 solicitado en la practica:

| Codigo | Clase | Iteracion |
|---|---|---|
| CRC-01 | Estudiante | Iteracion 1 |
| CRC-02 | Producto | Iteracion 1 |
| CRC-03 | Pedido | Iteracion 1 |
| CRC-04 | SrJulio | Iteracion 1 |
| CRC-05 | BeneficioFidelidad | Iteracion futura |

Ubicacion: `docs/04_tarjetas_crc.md`

## 6. Issues sugeridos para GitHub

Cada historia puede registrarse como un Issue del repositorio con etiquetas:

- `historia-usuario`
- `prioridad-alta`
- `prioridad-media`
- `iteracion-1`
- `xp`
- `planning-poker`
- `crc`

## 7. Checklist de entrega

- [x] README del repositorio.
- [x] Levantamiento de requerimientos.
- [x] Historias de usuario con criterios de aceptacion.
- [x] Notas y decisiones sobre ambiguedades.
- [x] Estimacion con Fibonacci.
- [x] Seleccion de Iteracion 1 con 20 puntos.
- [x] Tarjetas CRC.
- [x] Evidencia organizada para GitHub.

## 8. Comandos Git sugeridos para el equipo

```bash
git clone https://github.com/Alexsander1207/IngenioSnack.git
cd IngenioSnack
git status
git add .
git commit -m "docs: completar practica XP IngenioSnack"
git push origin main
```

## 9. Recomendacion para presentacion

En ADESA se debe subir el archivo `Caso_IngenioSnack_HU.docx`. En GitHub se mantiene la evidencia complementaria en formato Markdown para demostrar trabajo ordenado y trazabilidad.
