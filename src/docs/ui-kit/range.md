# Range — `<ui-range>`

Slider numérico sobre el input nativo `type="range"`, **personalizado por CSS
global** con tokens: pista redondeada + pulgar Solid 3D que **crece al arrastrar**
(active) y muestra **halo en hover/foco**. Muestra el valor en vivo junto a la
pista. Valor: `number` (reset → `0`).

## Uso

```html
<ui-range
  formControlName="priority"
  label="Prioridad"
  [min]="0"
  [max]="100"
  [step]="5"
/>
```

## API

| Input | Tipo | Default | Notas |
| --- | --- | --- | --- |
| `label` | `string` | `''` | |
| `min` / `max` | `number` | `0` / `100` | |
| `step` | `number` | `1` | |
| `hideValue` | `boolean` (atributo) | `false` | Oculta el número junto a la pista. |
| `error` | `string \| null` | `null` | |

`// TODO:` el valor vacío tras `reset()` es `0`; si algún caso necesita
"reset al mínimo", parametrizarlo.
