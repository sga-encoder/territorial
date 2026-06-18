# TextArea — `<ui-textarea>`

Campo de texto multilínea. Valor: `string` (reset → `''`).

## Uso

```html
<ui-textarea
  formControlName="description"
  label="Descripción"
  placeholder="Describe el reporte"
  [rows]="4"
  [error]="errorOf(form.controls.description)"
/>
```

## API

| Input | Tipo | Default |
| --- | --- | --- |
| `label` | `string` | `''` |
| `placeholder` | `string` | `''` |
| `rows` | `number` | `3` |
| `error` | `string \| null` | `null` |

Estrategia de errores y arquitectura compartida: ver [forms.md](forms.md).
