# Toggle — `<ui-toggle>`

Interruptor on/off: una pista tipo píldora con un knob que se desliza y puede
llevar un icono por estado. Es **sin estado** (refleja `checked` y emite
`toggled`); el consumidor es dueño del valor. En la navbar conmuta el tema
(sol = claro, luna = oscuro) cableado al `ThemeService`.

## Uso

```html
<!-- Conmutador de tema (navbar) -->
<ui-toggle
  [checked]="!theme.isDark()"
  iconOn="sun"
  iconOff="moon"
  label="Cambiar tema claro u oscuro"
  (toggled)="theme.toggle()"
/>
```

## API

| Input | Tipo | Default | Notas |
| --- | --- | --- | --- |
| `checked` | `boolean` (atributo) | `false` | Estado visual (encendido = knob a la derecha). |
| `disabled` | `boolean` (atributo) | `false` | |
| `label` | `string` | `''` | Nombre accesible (el switch no tiene texto visible). |
| `iconOn` / `iconOff` | `IconName \| null` | `null` | Icono opcional en el knob por estado. |

| Output | Payload |
| --- | --- |
| `toggled` | `void` |

## Accesibilidad

- `role="switch"` con `aria-checked` y `aria-label`; operable con teclado (es un
  `<button>`). Anillo de foco visible. El deslizamiento respeta
  `prefers-reduced-motion`.
- El knob usa `bg-foreground` (y el icono `text-background`), así **cambia de
  color con el tema** (claro en oscuro, oscuro en claro) y siempre contrasta.
