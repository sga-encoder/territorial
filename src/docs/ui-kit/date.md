# Date — `<ui-date>`

Campo de fecha con un **calendario glass totalmente personalizado** (el popup
nativo no se puede tematizar). El trigger se comporta como los demás controles;
al hacer clic abre un panel glass con navegación de mes y una cuadrícula de días.
Valor: `string` ISO `'yyyy-MM-dd'` (reset → `''`) — el contrato CVA no cambia.

## Uso

```html
<ui-date
  formControlName="visitDate"
  label="Fecha de visita"
  min="2026-01-01"
  [error]="errorOf(form.controls.visitDate)"
/>
```

## API

| Input | Tipo | Default |
| --- | --- | --- |
| `label` | `string` | `''` |
| `min` / `max` | `string \| null` (ISO) | `null` |
| `error` | `string \| null` | `null` |

La clase del componente es `DateField` (el nombre `Date` colisionaría con el
global de JavaScript); el selector sigue siendo `ui-date`.

## Interacción y accesibilidad

- Clic en el trigger abre/cierra el calendario; flechas ↑/↓/←/→ mueven el foco
  por la cuadrícula (±1 día / ±1 semana), Enter selecciona, Escape cierra; clic
  fuera también cierra.
- **Selección de año:** clic en el mes/año del encabezado abre una grilla de
  años (las flechas navegan bloques de 12); elegir un año vuelve a los días.
- Panel `role="dialog"`; cada día es un `<button>` con `aria-label` (fecha ISO),
  `aria-pressed` para el seleccionado y `aria-current="date"` para hoy.
- Respeta `min`/`max` (días fuera de rango quedan deshabilitados). Etiquetas de
  mes/día en español vía `Intl.DateTimeFormat`.
