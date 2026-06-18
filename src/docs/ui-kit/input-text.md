# InputText — `<ui-input>`

Campo de texto de una línea. Valor: `string` (reset → `''`).

## Uso

```html
<ui-input
  formControlName="email"
  type="email"
  label="Correo electrónico"
  placeholder="correo@dominio.com"
  [error]="errorOf(form.controls.email)"
/>
```

## API

| Input | Tipo | Default |
| --- | --- | --- |
| `label` | `string` | `''` |
| `placeholder` | `string` | `''` |
| `type` | `'text' \| 'email' \| 'password' \| 'number'` | `'text'` |
| `iconStart` | `IconName \| null` | `null` | icono decorativo a la izquierda |
| `iconEnd` | `IconName \| null` | `null` | icono decorativo a la derecha |
| `error` | `string \| null` | `null` |

- `type="password"` añade un botón de ojo a la derecha que **alterna la
  visibilidad** (publica `aria-pressed`); ignora `iconEnd` en ese caso.
- Reposo transparente (solo borde) → hover estilo Button (se eleva + glow) →
  foco cavidad glass → con datos Solid 3D. Puede ir en `<ui-field-group>`.

Estrategia de errores y arquitectura compartida: ver [forms.md](forms.md).
