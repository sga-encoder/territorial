# Title — `<ui-title>`

Encabezados del sistema, niveles 1–6 con jerarquía visual y accesible.

## Uso

```html
<ui-title [level]="1">Página</ui-title>
<ui-title [level]="2">Sección</ui-title>
<ui-title [level]="3" color="primary">Subsección destacada</ui-title>
```

## API

| Input | Tipo | Default | Notas |
| --- | --- | --- | --- |
| `level` | `1 \| 2 \| 3 \| 4 \| 5 \| 6` | `2` | Jerarquía semántica y escala visual. Binding: `[level]="3"`. |
| `color` | `'default' \| 'muted' \| 'primary'` | `'default'` | `primary` usa `primary-soft` (AA). |

## Accesibilidad

Expone la jerarquía con `role="heading"` + `aria-level` (equivalente WCAG a
h1–h6 nativos): un tag nativo dinámico exigiría duplicar `<ng-content>` entre
ramas de `@switch`, donde la proyección solo alimenta el primer slot.
`// TODO: a11y` — validar con AXE en la Capa 6 junto al resto del kit.
