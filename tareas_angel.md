# Tareas de Angel: Fidelidad Avanzada, Premios y Ranking de Clientes

Esta guía detalla tu parte del trabajo para el desarrollo colaborativo en IngenioSnack.

---

## 1. Objetivos del Módulo
* Mostrar al **Vendedor** un Ranking de Clientes más fieles (estudiantes ordenados por puntos acumulados o cantidad de compras).
* Permitir al **Vendedor** definir dinámicamente nuevas reglas de fidelidad/premios (ej: "Por cada 10 compras de café, el 11 es gratis", o definir un producto X de premio por cada Y compras de un producto Z).
* Integrar la lógica en la tienda del **Estudiante** para que este pueda ver sus premios acumulados y reclamarlos/canjearlos.

---

## 2. Estructura de Base de Datos (Ya configurada en Supabase)
El administrador del proyecto ya configuró las tablas en Supabase. Tú interactuarás con las siguientes tablas:

* **Tabla `reglas_fidelidad`**:
  * `id` (uuid, primary key)
  * `nombre` (text)
  * `producto_criterio_id` (uuid, foreign key)
  * `cantidad_criterio` (integer)
  * `producto_premio_id` (uuid, foreign key)
  * `activo` (boolean)
* **Tabla `progreso_fidelidad`**:
  * `id` (uuid, primary key)
  * `estudiante_id` (text, foreign key)
  * `producto_criterio_id` (uuid, foreign key)
  * `cantidad_acumulada` (integer)
  * `premios_disponibles` (integer)

---

## 3. Tareas en el Backend

### Modificación del Servicio de Fidelidad
* **Archivo a modificar**: [fidelidadService.js](file:///c:/Users/Usuario/IngenioSnack/src/services/fidelidadService.js)
  * Crear métodos asíncronos para gestionar las reglas:
    * `crearReglaFidelidad({ nombre, productoCriterioId, cantidadCriterio, productoPremioId })`
    * `listarReglasFidelidad()`
    * `obtenerRankingClientes()` (realiza una consulta a la tabla `estudiantes` ordenando por `puntos` de forma descendente).
    * Adaptar la función `registrarSandwich` o generalizarla como `actualizarProgresoCompra(estudianteId, productoId, cantidad)` para que consulte las reglas activas de la tabla `reglas_fidelidad`, incremente el contador en `progreso_fidelidad` y asigne un premio disponible si se alcanza el umbral.

### Rutas de Fidelidad y Ranking
* **Archivo a modificar/crear**: Exponer los nuevos endpoints en rutas del backend:
  * `GET /api/fidelidad/ranking` -> Retorna el ranking de estudiantes más fieles.
  * `GET /api/fidelidad/reglas` -> Lista las reglas configuradas.
  * `POST /api/fidelidad/reglas` -> Crea una nueva regla.
  * `POST /api/estudiante/:id/canjear-premio` -> Canjea un premio acumulado.

---

## 4. Tareas en el Frontend (React)

### Panel de Ranking y Reglas (Vendedor)
* Agregar vistas en el panel de administrador (`client/src/pages/admin/`):
  * **Ranking de Clientes**: Una tabla con foto/nombre, código del estudiante y puntos totales.
  * **Configuración de Premios**: Un formulario para elegir el Producto A, la cantidad y el Producto de regalo (Producto B).

### Panel del Estudiante (Visualización y Canje)
* En el perfil o panel del estudiante (`client/src/pages/student/Profile.jsx` o `Menu.jsx`), mostrar el progreso dinámico hacia sus premios gratis (ej. barra de progreso basada en las reglas activas).
* Permitir al estudiante hacer clic en "Canjear" cuando tenga un premio disponible.

---

## 5. Instrucciones de Git para subir cambios
Trabaja en tu propia rama antes de subir los cambios a `main`:

```bash
# 1. Crear tu rama de trabajo
git checkout -b feature/fidelidad-ranking

# 2. Agregar tus cambios e ir commiteando
git add .
git commit -m "feat(fidelidad): reglas dinamicas y ranking de clientes con backend"

# 3. Subir tu rama a GitHub
git push origin feature/fidelidad-ranking

# 4. Cuando todo esté verificado y funcione sin errores, intégralo a main
git checkout main
git pull origin main
git merge feature/fidelidad-ranking
git push origin main
```
