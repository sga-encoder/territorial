# Select — `<ui-select>`

Select personalizado (patrón combobox + listbox). El trigger se comporta como
todo input (transparente en reposo → Solid 3D al elegir opción); **el panel es
glass casi opaco** (`--color-glass-strong`) y se **portaliza a `<body>`**
(`position: fixed`), así nunca lo recorta una card/filtro/contenedor con
`overflow` y se voltea hacia arriba si no hay espacio abajo. Valor: `string |
null`. Soporta `iconStart` y puede agruparse en `<ui-field-group>`.

## Uso

```ts
protected readonly cityOptions: readonly FieldOption[] = [
  { value: 'manizales', label: 'Manizales' },
  { value: 'neira', label: 'Neira', disabled: true },
];
```

```html
<ui-select
  formControlName="city"
  label="Ciudad"
  placeholder="Selecciona una ciudad"
  [options]="cityOptions"
  [error]="errorOf(form.controls.city)"
/>
```

## API

| Input | Tipo | Default |
| --- | --- | --- |
| `label` | `string` | `''` |
| `placeholder` | `string` | `'Seleccionar…'` |
| `options` | `readonly FieldOption[]` (requerido) | — |
| `iconStart` | `IconName \| null` | `null` |
| `error` | `string \| null` | `null` |

## Interacción y accesibilidad

- Teclado: ↓/↑ abren y mueven la opción activa (saltando deshabilitadas),
  Enter selecciona, Escape cierra; clic fuera también cierra.
- Las opciones se eligen con `mousedown` (dispara antes del blur del trigger,
  evitando que el panel se cierre antes de seleccionar).
- ARIA: `role="combobox"` + `aria-expanded/controls` en el trigger,
  `role="listbox/option"` + `aria-selected` en el panel.
- `// TODO: a11y` — `aria-activedescendant` y scroll de la opción activa al
  navegar listas largas.
