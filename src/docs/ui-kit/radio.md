# Radio — `<ui-radio>`

Grupo de radios: **un solo CVA para todo el conjunto** (el valor es el de la
opción elegida). Los radios **nativos** se conservan (ocultos, `peer`) por
accesibilidad, dentro de `fieldset` + `legend`; el visual es **propio** con
tokens: anillo glass con un **punto que aparece con rebote**, **halo en hover** y
anillo de foco (respeta `prefers-reduced-motion`). Valor: `string | null`.

## Uso

```ts
protected readonly roleOptions: readonly FieldOption[] = [
  { value: 'citizen', label: 'Ciudadano' },
  { value: 'official', label: 'Funcionario' },
];
```

```html
<ui-radio
  formControlName="role"
  label="Rol"
  [options]="roleOptions"
  [error]="errorOf(form.controls.role)"
/>
```

## API

| Input | Tipo | Default |
| --- | --- | --- |
| `label` | `string` (legend del grupo) | `''` |
| `options` | `readonly FieldOption[]` (requerido) | — |
| `error` | `string \| null` | `null` |

El `name` interno es único por instancia, así que varios grupos conviven en
la misma página sin interferirse.
