# Checkbox — `<ui-checkbox>`

Campo booleano. El checkbox **nativo** se conserva (oculto, `peer`) por
accesibilidad, pero el visual es **propio** con tokens: caja glass que pasa a
primario al marcarse, con un **check que aparece con rebote**, **halo al pasar el
cursor** y anillo de foco (vía `peer-*`, respeta `prefers-reduced-motion`).
Valor: `boolean` (reset → `false`).

## Uso

```html
<ui-checkbox
  formControlName="terms"
  label="Acepto los términos y el tratamiento de datos"
  [error]="errorOf(form.controls.terms, { required: 'Debes aceptar los términos.' })"
/>
```

## API

| Input | Tipo | Default |
| --- | --- | --- |
| `label` | `string` | `''` |
| `error` | `string \| null` | `null` |

Para "requerido" usa `Validators.requiredTrue` (su clave de error es
`required`). Estrategia de errores: ver [forms.md](forms.md).
