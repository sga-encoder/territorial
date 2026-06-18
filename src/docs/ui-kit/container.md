# Container — `<ui-container>`

Átomo de layout del UI Kit: la **única** forma de organizar contenido en la
aplicación (RN-UI-02). Flex o grid, con alineación, gap y presets de centrado.

## Uso

```html
<!-- Preset: centrado total -->
<ui-container center="both">…</ui-container>

<!-- Preset + granular: el granular gana en su eje (RN-UI-04) -->
<ui-container center="both" justify="between">…</ui-container>

<!-- Columna con separación -->
<ui-container direction="column" [gap]="4">…</ui-container>

<!-- Grid de 3 columnas -->
<ui-container layout="grid" [cols]="3" [gap]="4">…</ui-container>
```

## API

| Input | Tipo | Default | Notas |
| --- | --- | --- | --- |
| `layout` | `'flex' \| 'grid'` | `'flex'` | |
| `direction` | `'row' \| 'column'` | `'row'` | Solo flex. |
| `center` | `'both' \| 'horizontal' \| 'vertical' \| null` | `null` | Preset en ejes **físicos** (pantalla). |
| `align` | `'start' \| 'center' \| 'end' \| 'stretch' \| null` | `null` | Eje cross (**lógico**). Gana sobre el preset. |
| `justify` | `'start' \| 'center' \| 'end' \| 'between' \| 'around' \| 'evenly' \| null` | `null` | Eje main (**lógico**). Gana sobre el preset. |
| `wrap` | `boolean` (atributo) | `false` | Solo flex: `<ui-container wrap>`. |
| `gap` | `0 \| 1 \| 2 \| 3 \| 4 \| 6 \| 8 \| 12` | `0` | Escala de espaciado del kit (×0.25rem). Usar binding: `[gap]="4"`. |
| `cols` | `1 \| 2 \| 3 \| 4 \| 6 \| 12` | `1` | Solo grid. Usar binding: `[cols]="3"`. |

## Reglas de precedencia (RN-UI-04)

`center` habla en ejes físicos y `align`/`justify` en ejes lógicos, así que la
traducción depende de `direction`:

| `center` | En `row` | En `column` |
| --- | --- | --- |
| `horizontal` | `justify-center` (main) | `items-center` (cross) |
| `vertical` | `items-center` (cross) | `justify-center` (main) |
| `both` | ambos | ambos |

Si además se pasa un input granular, este **gana en su propio eje**; el preset
conserva el otro eje. En grid, `center="horizontal"` centra las celdas
(`justify-items`), propiedad distinta de `justify` (content) — no compiten.

## Notas

- Los inputs numéricos (`gap`, `cols`, `level` en Title) van con binding
  `[gap]="4"` — como atributo (`gap="4"`) llegaría un string y el tipo lo
  rechaza.
- El centrado vertical "de página completa" depende de la altura del padre:
  el Container no impone alto propio.
- `// TODO: responsive` — `cols` aún no tiene variantes por breakpoint; se
  añadirán cuando una feature las necesite.
