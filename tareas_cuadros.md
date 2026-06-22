# Tareas de Cuadros: Categorías, Filtros y Diseño Visual

Esta guía detalla tu parte del trabajo para el desarrollo colaborativo en IngenioSnack.

---

## 1. Objetivos del Módulo
* Permitir al **Vendedor** crear y gestionar categorías de productos.
* Permitir al **Estudiante** filtrar los productos de la tienda por categorías.
* Pulir y elevar el diseño visual de toda la aplicación (paleta de colores premium café/caramelo, animaciones, sombras y responsividad).

---

## 2. Base de Datos (Supabase SQL)
Deberás crear y relacionar la tabla de categorías. Ejecuta este script en el SQL Editor de Supabase:

```sql
-- Tabla de Categorías
create table if not exists categorias (
  id uuid default gen_random_uuid() primary key,
  nombre text not null unique,
  creado_en timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Modificar productos para relacionarlo a categorías
alter table productos 
add column if not exists categoria_id uuid references categorias(id) on delete set null;
```

---

## 3. Tareas en el Backend

### Nuevo Servicio de Categorías
* **Archivo Nuevo**: `src/services/categoriaService.js`
  * Crear métodos asíncronos para interactuar con la tabla `categorias` en Supabase:
    * `listarCategorias()`
    * `crearCategoria(nombre)`
    * `eliminarCategoria(id)`

### Rutas de Categorías
* **Archivo Nuevo**: `src/routes/categoriaRoutes.js`
  * Exponer los endpoints:
    * `GET /api/categorias`
    * `POST /api/categorias` (requiere `{ nombre }`)
    * `DELETE /api/categorias/:id`
  * Registrar estas rutas en [server.js](file:///c:/Users/Usuario/IngenioSnack/server.js).

### Actualizar Producto Service y Rutas
* **Archivos a modificar**: [productoService.js](file:///c:/Users/Usuario/IngenioSnack/src/services/productoService.js) y [productoRoutes.js](file:///c:/Users/Usuario/IngenioSnack/src/routes/productoRoutes.js)
  * Modificar la creación de productos para recibir y registrar `categoria_id`.
  * Permitir que `listarProductosDisponibles` acepte un filtro opcional por `categoria_id` (ej. `GET /api/productos?categoriaId=uuid`).

---

## 4. Tareas en el Frontend (React)

### Panel de Gestión de Categorías (Vendedor)
* Agregar una pestaña o sección en el panel administrativo (`client/src/pages/admin/`) para crear, listar y eliminar categorías.

### Formulario de Creación de Productos
* Modificar el formulario de creación de productos para mostrar un elemento `<select>` con las categorías cargadas dinámicamente desde el backend.

### Tienda del Estudiante (Filtros)
* En la vista de menú del estudiante (`client/src/pages/student/Menu.jsx`), añadir un menú horizontal o barra lateral interactiva con las categorías.
* Al hacer clic en una categoría, filtrar dinámicamente la lista de productos disponibles.

### Estética y Estilos Visuales
* Pulir los estilos en `client/src/index.css` y las páginas principales.
* Asegurar el uso de la paleta caramelo/café, efectos glassmorphism en los paneles, sombreados sutiles, micro-animaciones en botones e inputs, y diseño responsivo para móviles.

---

## 5. Instrucciones de Git para subir cambios
Trabaja en tu propia rama antes de subir los cambios a `main`:

```bash
# 1. Crear tu rama de trabajo
git checkout -b feature/categorias-diseño

# 2. Agregar tus cambios e ir commiteando
git add .
git commit -m "feat(categorias): agregar CRUD de categorias y filtros en frontend"

# 3. Subir tu rama a GitHub
git push origin feature/categorias-diseño

# 4. Cuando todo esté verificado y funcione sin errores, intégralo a main
git checkout main
git pull origin main
git merge feature/categorias-diseño
git push origin main
```
