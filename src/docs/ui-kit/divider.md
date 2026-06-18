# Divider — `<ui-divider>`

Línea de separación que consume el token `border`.

## Uso

```html
<!-- Horizontal (default): ocupa todo el ancho -->
<ui-divider />

<!-- Vertical: se estira dentro de un Container en fila -->
<ui-container [gap]="4">
  <ui-text>A</ui-text>
  <ui-divider orientation="vertical" />
  <ui-text>B</ui-text>
</ui-container>
```

## API

| Input | Tipo | Default | Notas |
| --- | --- | --- | --- |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | El vertical usa `self-stretch`: requiere padre flex. |

## Accesibilidad

Expone `role="separator"` y `aria-orientation` acorde a la orientación.
