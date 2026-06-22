# Tareas de Franklin: Promociones y Combos

Esta guía detalla tu parte del trabajo para el desarrollo colaborativo en IngenioSnack.

---

## 1. Objetivos del Módulo
* Permitir al **Vendedor** crear promociones o "combos" (ej: Sandwich + Bebida a precio reducido).
* Permitir al **Estudiante** ver las promociones activas, agregarlas al carrito y comprarlas como si fuesen un producto individual.

---

## 2. Estructura de Base de Datos (Ya configurada en Supabase)
El administrador del proyecto ya configuró las tablas en Supabase. Tú interactuarás con las siguientes tablas:

* **Tabla `promociones`**:
  * `id` (uuid, primary key)
  * `nombre` (text)
  * `descripcion` (text)
  * `precio` (numeric)
  * `disponible` (boolean)
  * `activo` (boolean)
* **Tabla `items_promocion`** (Productos que componen el combo):
  * `id` (uuid, primary key)
  * `promocion_id` (uuid, foreign key)
  * `producto_id` (uuid, foreign key)
  * `cantidad` (integer)

---

## 3. Tareas en el Backend

### Servicio de Promociones
* **Archivo Nuevo**: `src/services/promocionService.js`
  * Crear métodos asíncronos:
    * `crearPromocion({ nombre, descripcion, precio, productos })` (inserta en `promociones` y en `items_promocion`).
    * `listarPromociones()` (retorna promociones activas con sus productos asociados).
    * `desactivarPromocion(id)` (baja lógica, cambia `activo = false`).
    * `cambiarDisponibilidadPromocion(id, disponible)`.

### Rutas de Promociones
* **Archivo Nuevo**: `src/routes/promocionRoutes.js`
  * Exponer los endpoints:
    * `GET /api/promociones`
    * `POST /api/promociones` (creación del combo)
    * `PUT /api/promociones/:id`
    * `DELETE /api/promociones/:id` (baja lógica)
  * Registrar estas rutas en [server.js](file:///c:/Users/Usuario/IngenioSnack/server.js).

### Actualizar Pedido Service
* **Archivo a modificar**: [pedidoService.js](file:///c:/Users/Usuario/IngenioSnack/src/services/pedidoService.js)
  * Permitir que las líneas de un pedido puedan contener un `promocion_id` o adaptar la lógica para que al comprar un combo, se descuente el stock de cada uno de los productos individuales que conforman dicho combo.

---

## 4. Tareas en el Frontend (React)

### Panel de Creación de Combos (Vendedor)
* Crear una interfaz para el vendedor que le permita:
  * Elegir qué productos compondrán la promoción.
  * Definir un nombre, descripción y el precio especial de la oferta.
  * Guardar la promoción.

### Tienda del Estudiante (Apartado Promociones)
* Mostrar de forma destacada los Combos/Promociones en el menú del estudiante (`client/src/pages/student/Menu.jsx`).
* Permitir al estudiante añadir el combo al carrito (`client/src/pages/student/Cart.jsx`) y finalizar la compra.

---

## 5. Instrucciones de Git para subir cambios
Trabaja en tu propia rama antes de subir los cambios a `main`:

```bash
# 1. Crear tu rama de trabajo
git checkout -b feature/promociones-combos

# 2. Agregar tus cambios e ir commiteando
git add .
git commit -m "feat(promociones): modulo de combos y descuento de stock en backend"

# 3. Subir tu rama a GitHub
git push origin feature/promociones-combos

# 4. Cuando todo esté verificado y funcione sin errores, intégralo a main
git checkout main
git pull origin main
git merge feature/promociones-combos
git push origin main
```
