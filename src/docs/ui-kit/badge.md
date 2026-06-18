# Badge — `<ui-badge>`

Píldora de estado: tinte translúcido (`*-tint`) con texto de la misma familia
semántica — AA en ambos temas. **Se ilumina (glow del color) y crece al pasar el
cursor**, y **rebota desde el centro al hacer clic** (microinteracción decorativa,
respeta `prefers-reduced-motion`).

## Uso

```html
<ui-badge variant="success">activa</ui-badge>
<ui-badge variant="warning" size="sm">pendiente</ui-badge>
<ui-badge>neutral</ui-badge>
```

## API

| Input | Tipo | Default |
| --- | --- | --- |
| `variant` | `'neutral' \| 'primary' \| 'success' \| 'warning' \| 'danger' \| 'info'` | `'neutral'` |
| `size` | `'sm' \| 'md'` | `'md'` |

## Notas

- Badge = estado (esquinas full/píldora). Para categorías removibles usar
  [Chip](chip.md) (esquinas md).
- Encaja en celdas de Table vía slot `uiTableCell` (ver [table.md](table.md)).
