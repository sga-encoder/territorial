# Roadmap

_Orden y estado de las features. Cada entrada nueva apunta a su carpeta en `features/`._

## Hecho ✅

_Implementado antes de adoptar SDD (sin carpeta en `features/`; documentado en `src/docs/`)._

1. **000 · UI Kit + generadores** — design system y FormGenerator/Filter/DynamicTable.
2. **000 · Auth y shell** — Firebase Auth, guards por rol, layout.
3. **000 · CRUDs de recursos** — entidades, funcionarios, ciudadanos, territorio, catálogo, anotaciones, votos, evidencias, interesados (`src/docs/crud-resources.md`).
4. **000 · Editor de polígonos** — demarcación de barrios (`src/docs/neighborhood-polygon-editor.md`).
5. **000 · Reportes** — gráficas y chat (`src/docs/reports.md`).
6. **000 · Usuarios pendientes** — asignación de rol.

## Siguiente 🔜

1. **001 · Seed de demostración** — base llena de datos de ejemplo + cuentas Firebase demo (en curso, falta verificación visual).
2. **002 · Imágenes en Cloudinary** — logos, categorías y evidencias fuera del disco efímero de Render (en curso).
3. **003 · Backend desplegado** — API en Render con Neon + Cloudinary; frontend apuntando a Render (falta verificación visual).

_Luego: crear `features/004-<nombre>/` desde `features/_template/`._

## Backlog / ideas 💡

- **Tracking en tiempo real (CU-11)** — confirmar WebSocket vs polling (`spec.md` §10).
- **Suite de tests** — generar desde la sección Validation de `spec.md`.

> Cada feature nueva se crea como `features/NNN-nombre-feature/` con `spec.md`, `plan.md` y `tasks.md` antes de tocar código.
