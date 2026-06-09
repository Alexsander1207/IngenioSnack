# Guia de contribucion — IngenioSnack

Para evitar choques de `push` entre los 5 integrantes, **no trabajamos directo sobre
`main`**. Cada quien trabaja en su propia rama y la integra mediante Pull Request (PR).

## 1. Flujo de trabajo

```bash
# 1. Parte siempre desde main actualizado
git checkout main
git pull origin main

# 2. Crea tu rama (ver convencion de nombres abajo)
git checkout -b backend/productos-imagenes

# 3. Trabaja, commitea y sube tu rama
git add -A
git commit -m "feat(productos): subir imagenes"
git push -u origin backend/productos-imagenes

# 4. Abre un Pull Request hacia main (en GitHub o con gh)
gh pr create --fill --base main
```

## 2. Convencion de nombres de rama

| Prefijo      | Para        | Responsable principal |
|--------------|-------------|------------------------|
| `backend/`   | Servicios, Supabase, lógica | Integrante 2 / 3 |
| `frontend/`  | Vistas, diseño, responsive  | Integrante 1     |
| `tests/`     | Pruebas y refactor          | Integrante 3     |
| `docs/`      | Documentación y evidencias  | Integrante 4     |

Ejemplos: `backend/pedido-supabase`, `frontend/vista-dueño`, `docs/sprint-2`.

## 3. Reglas del PR

- El PR apunta a `main`.
- Antes de abrirlo, corre `npm test` y asegurate de que **todo este en verde**.
- Pide a 1 compañero que lo revise antes de hacer merge.
- Si `main` avanzo mientras trabajabas, actualiza tu rama:

  ```bash
  git fetch origin
  git rebase origin/main   # resuelve conflictos si los hay
  ```

## 4. Que NO hacer

- No hacer `git push --force` sobre `main`.
- No commitear el archivo `.env` (esta en `.gitignore`).
- No borrar productos en la base de datos: se desactivan (`activo = false`).

## 5. Convencion de commits

`tipo(area): descripcion corta` — ejemplos:

- `feat(productos): agregar listarProductosDisponibles`
- `fix(pedido): corregir calculo de subtotal`
- `docs(sprint1): documentar esquema de Supabase`
- `test(productos): cubrir validacion de precio`
