# Bitacora — Sprint 1: Base tecnica, Supabase y gestion de productos

**Proyecto:** IngenioSnack
**Objetivo:** Conectar Supabase y permitir al dueño registrar, editar, activar y
desactivar productos del menu (HU-01, HU-04).

---

## Tareas realizadas

| # | Tarea                                                            | Responsable (rol)              | Estado |
|---|------------------------------------------------------------------|--------------------------------|--------|
| 1 | Crear proyecto IngenioSnack en Supabase                          | Backend (Int. 2)               | ✅ |
| 2 | Crear tabla `productos` (con RLS y check de precio)              | Backend (Int. 2)               | ✅ |
| 3 | Cliente de conexion `src/config/supabaseClient.js`              | Backend (Int. 2)               | ✅ |
| 4 | Variables de entorno `.env` y `.env.example`                    | Backend (Int. 2)               | ✅ |
| 5 | Servicio `src/services/productoService.js` con reglas de negocio| Backend (Int. 2)               | ✅ |
| 6 | Pruebas de `productoService` (10 tests, cliente mockeado)       | Tests (Int. 3)                 | ✅ |
| 7 | Documentacion del esquema `SUPABASE_SCHEMA.md`                  | Documentacion (Int. 4)         | ✅ |
| 8 | Actualizacion del README (tecnologias, conexion, comandos)      | Documentacion (Int. 4)         | ✅ |
| 9 | Vistas del estudiante/dueño y diseño responsive                 | Frontend (Int. 1)              | 🔧 En curso |

---

## Problemas y soluciones

| Problema | Solucion |
|----------|----------|
| No existia un proyecto Supabase llamado IngenioSnack (los demas estaban inactivos). | Se creo un proyecto dedicado `IngenioSnack` (free tier, us-east-1). |
| Las pruebas no deben depender de la red ni de la BD real. | El cliente de Supabase se reemplaza con `jest.mock`; las validaciones son funciones puras. |
| El linter de Supabase reporta politicas RLS permisivas (`always_true`). | Documentado como pendiente: restringir INSERT/UPDATE a usuarios autenticados antes de produccion. |
| Riesgo de borrar productos por error. | Regla "no eliminar, solo desactivar": no se creo policy de DELETE; baja logica con `activo = false`. |

---

## Verificacion (criterios de cierre)

- [x] Supabase conectado (lectura real verificada: 3 disponibles, 4 activos).
- [x] Tabla `productos` creada.
- [x] El dueño puede registrar productos (`crearProducto`).
- [x] El dueño puede activar/desactivar (`cambiarDisponibilidadProducto`, `desactivarProducto`).
- [x] El estudiante solo ve disponibles y activos (`listarProductosDisponibles`).
- [x] Las pruebas de productos pasan (10/10; suite total 32/32).
- [x] Documentacion de Supabase creada.

---

## Evidencias pendientes (capturas manuales)

- Captura de la tabla `productos` en el panel de Supabase.
- Captura de los productos registrados (filas de la tabla).
- Captura de `npm test` con las pruebas en verde.
