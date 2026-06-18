# Tooltip — directiva `uiTooltip`

Pista contextual glass aplicable a **cualquier elemento** (componentes del
kit incluidos). Aparece con hover **y con foco de teclado**, y se anuncia vía
`aria-describedby` + `role="tooltip"`.

## Uso

```html
<ui-button variant="ghost" uiTooltip="Eliminar entidad">
  <ui-icon name="trash" size="sm" />
</ui-button>

<ui-badge variant="warning" uiTooltip="Pendiente de revisión" tooltipPosition="bottom">
  pendiente
</ui-badge>
```

## API

| Input | Tipo | Default | Notas |
| --- | --- | --- | --- |
| `uiTooltip` | `string` (requerido) | — | Texto plano; vacío no muestra nada. |
| `tooltipPosition` | `'top' \| 'bottom' \| 'left' \| 'right'` | `'top'` | |

## Notas de implementación

- El elemento se añade a `<body>` con posición `fixed`, así ningún
  `overflow` de ancestros lo recorta; `pointer-events-none` evita que el
  propio tooltip re-dispare el hover.
- Las coordenadas se calculan con `getBoundingClientRect` (estilos
  imperativos inevitables: dependen de geometría en runtime).
- `// TODO: a11y` — ocultar con ESC y reposicionar en scroll/resize mientras
  está visible.
