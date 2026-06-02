# 10. Prototipos de baja fidelidad

Estos prototipos son bocetos textuales de las pantallas principales. Su objetivo es validar el flujo con el cliente sin invertir tiempo en disenos complejos. Esto respeta el principio XP de simplicidad y retroalimentacion temprana.

## 1. Pantalla de identificacion del estudiante

```text
+--------------------------------+
|        IngenioSnack            |
|  Pide antes, recoge rapido     |
+--------------------------------+
| Codigo o correo institucional  |
| [___________________________]  |
|                                |
| [ Continuar ]                  |
+--------------------------------+
```

### Historias relacionadas

- HU-01 Identificacion del estudiante.

### Validaciones

- El campo no debe estar vacio.
- El identificador se asocia al pedido.

---

## 2. Pantalla de menu disponible

```text
+--------------------------------+
| Menu disponible                |
+--------------------------------+
| Sandwich de pollo      S/ 6.00 |
| [ Agregar ]                    |
|                                |
| Cafe americano         S/ 3.00 |
| [ Agregar ]                    |
|                                |
| Galleta                S/ 2.00 |
| [ Agregar ]                    |
+--------------------------------+
| [ Ver pedido ]                 |
+--------------------------------+
```

### Historias relacionadas

- HU-02 Consulta de menu disponible.
- HU-03 Pedido anticipado desde celular.

### Validaciones

- Solo se muestran productos disponibles.
- Los productos desactivados no deben aparecer como disponibles.

---

## 3. Pantalla de resumen del pedido

```text
+--------------------------------+
| Resumen del pedido             |
+--------------------------------+
| Estudiante: 2023XXXXX          |
|                                |
| 1 Sandwich de pollo    S/ 6.00 |
| 1 Cafe americano       S/ 3.00 |
|                                |
| Total:                 S/ 9.00 |
+--------------------------------+
| Pago: contra entrega           |
| [ Confirmar pedido ]           |
| [ Volver al menu ]             |
+--------------------------------+
```

### Historias relacionadas

- HU-03 Pedido anticipado desde celular.
- HU-04 Validacion de disponibilidad.

### Validaciones

- Antes de confirmar, el sistema revisa disponibilidad.
- Si algun producto ya no esta disponible, el pedido no se confirma.

---

## 4. Pantalla de aviso de no disponibilidad

```text
+--------------------------------+
| Producto no disponible         |
+--------------------------------+
| Lo sentimos.                   |
| El Sandwich de pollo ya no     |
| esta disponible.               |
|                                |
| Puedes elegir otra opcion.     |
+--------------------------------+
| [ Volver al menu ]             |
+--------------------------------+
```

### Historias relacionadas

- HU-04 Validacion de disponibilidad.

### Validaciones

- El sistema debe bloquear la confirmacion.
- El estudiante debe poder regresar al menu.

---

## 5. Pantalla del Sr. Julio - Disponibilidad del menu

```text
+--------------------------------+
| Gestion de productos           |
+--------------------------------+
| Sandwich de pollo      Activo  |
| [ Desactivar ]                 |
|                                |
| Cafe americano         Activo  |
| [ Desactivar ]                 |
|                                |
| Sandwich mixto     No activo   |
| [ Activar ]                    |
+--------------------------------+
```

### Historias relacionadas

- HU-05 Gestion rapida de disponibilidad.

### Validaciones

- El cambio debe reflejarse en el menu del estudiante.
- Los productos no activos no deben poder pedirse.

---

## 6. Pantalla futura - Fidelidad

```text
+--------------------------------+
| Programa de fidelidad          |
+--------------------------------+
| Sandwiches comprados: 7 / 10   |
|                                |
| Te faltan 3 sandwiches para    |
| ganar un cafe americano gratis |
+--------------------------------+
```

### Historias relacionadas

- HU-07 Programa de fidelidad.

### Nota

Esta pantalla no entra en la Iteracion 1. Se incluye como referencia para una futura iteracion.

## 7. Criterio de diseno

Los prototipos priorizan:

- Uso desde celular.
- Pantallas simples.
- Pocos botones.
- Mensajes claros.
- Sin pagos digitales.
- Sin configuraciones complejas.
