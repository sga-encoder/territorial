# Button — `<ui-button>`

Átomo de acción. Relleno por color **independiente** según el estado (reposo
tintado → hover relleno → active sólido) y un *ripple* circular que nace del
punto exacto del clic. Cada variante conserva su propio matiz en cada estado.

## Uso

```html
<ui-button (clicked)="save()">Guardar</ui-button>
<ui-button variant="secondary" size="sm">Cancelar</ui-button>
<ui-button variant="danger" (clicked)="remove()">Eliminar</ui-button>
<ui-button [loading]="saving()">Guardando…</ui-button>

<!-- Con ícono (hereda el color del texto vía currentColor) -->
<ui-button variant="secondary">
  <ui-icon name="plus" size="sm" />
  Nueva entidad
</ui-button>

<!-- En formularios (Capa 4) -->
<ui-button type="submit">Enviar</ui-button>
```

## API

| Input | Tipo | Default | Notas |
| --- | --- | --- | --- |
| `variant` | `'primary' \| 'secondary' \| 'ghost' \| 'danger'` | `'primary'` | |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Alturas 32/40/48px. |
| `loading` | `boolean` | `false` | Muestra spinner inline, bloquea interacción y publica `aria-busy`. |
| `disabled` | `boolean` | `false` | |
| `type` | `'button' \| 'submit'` | `'button'` | `submit` participa en el form que lo envuelve. |

| Output | Payload | Notas |
| --- | --- | --- |
| `clicked` | `void` | Solo emite si el botón está operable: el consumidor no necesita guardas propias de disabled/loading. |

## Notas de diseño

- Cada variante define su color en **cada estado** con rgba explícitos
  (reposo/hover/active) y solo transiciona propiedades nombradas — **nunca**
  `transition`/`transition-all`, que contaminaría el color entre variantes.
  El hover (blanco sobre azul/rojo al 72%) está verificado ≥4.5:1 (AA).
- El *ripple* se dibuja en `pointerdown` (solo navegador) con el color de la
  variante; `@keyframes ripple-expand` vive en `styles.scss` y respeta
  `prefers-reduced-motion`. En las variantes **de color** (`primary`/`danger`)
  el ripple lleva además una `box-shadow` (glow): como `transform: scale`
  también escala la sombra, el relleno **y** su glow se expanden juntos dentro
  del botón al activarlo (`RIPPLE_GLOW`).
- El foco visible lo da el anillo global (`:focus-visible` + `focus-ring`, 3px).
