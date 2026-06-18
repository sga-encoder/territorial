# Text — `<ui-text>`

Átomo tipográfico para texto corrido: cuerpo, anotaciones y etiquetas.

## Uso

```html
<ui-text>Texto principal de lectura.</ui-text>
<ui-text variant="caption">Anotación secundaria (muted por defecto).</ui-text>
<ui-text variant="label">Etiqueta de campo (peso medio por defecto).</ui-text>

<!-- Overrides explícitos -->
<ui-text color="danger" weight="semibold">No se pudo guardar.</ui-text>
```

## API

| Input | Tipo | Default | Notas |
| --- | --- | --- | --- |
| `variant` | `'body' \| 'caption' \| 'label'` | `'body'` | Define tamaño + defaults de color/peso. |
| `color` | `'default' \| 'muted' \| 'primary' \| 'success' \| 'warning' \| 'danger' \| 'info' \| null` | `null` | `null` hereda el default de la variante. |
| `weight` | `'normal' \| 'medium' \| 'semibold' \| 'bold' \| null` | `null` | `null` hereda el default de la variante. |

Defaults por variante: `body` → default/normal · `caption` → muted/normal ·
`label` → default/medium.

## Notas

- `color="primary"` usa el token `primary-soft` (el primario **legible** AA
  sobre el fondo actual); el primario de marca puro se reserva para acentos.
- Se renderiza como bloque; para componer textos en línea úsese un
  `<ui-container>` con `gap`.
- Todos los colores provienen de tokens y cumplen AA en ambos temas.
