# Chip / Tag — `<ui-chip>`

Etiqueta para categorías múltiples y filtros activos. **Se ilumina (glow) y crece
en hover**, y **rebota desde el centro al hacer clic** (respeta
`prefers-reduced-motion`). `removable` añade un botón accesible de quitar; el chip
**no se borra solo**: emite `removed` y el consumidor actualiza su colección
(única fuente de verdad fuera del kit).

## Uso

```html
@for (category of categories(); track category) {
  <ui-chip
    variant="primary"
    removable
    [removeLabel]="'Quitar ' + category"
    (removed)="removeCategory(category)"
  >
    {{ category }}
  </ui-chip>
}
```

## API

| Input | Tipo | Default | Notas |
| --- | --- | --- | --- |
| `variant` | `'neutral' \| 'primary' \| 'success' \| 'warning' \| 'danger' \| 'info'` | `'neutral'` | |
| `removable` | `boolean` (atributo) | `false` | |
| `removeLabel` | `string` | `'Quitar'` | aria-label del botón; incluir la etiqueta del chip. |

| Output | Payload |
| --- | --- |
| `removed` | `void` |
