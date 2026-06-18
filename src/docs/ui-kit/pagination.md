# Pagination — `<ui-pagination>`

Paginador **controlado**: `currentPage` entra por input y `pageChanged` pide
al consumidor actualizarlo — la fuente de verdad de la página vive fuera del
kit (signal de la feature, query param, etc.).

## Uso

```ts
protected readonly page = signal(1);
```

```html
<ui-pagination
  [total]="totalRecords()"
  [pageSize]="10"
  [currentPage]="page()"
  (pageChanged)="page.set($event)"
/>
```

## API

| Input | Tipo | Default | Notas |
| --- | --- | --- | --- |
| `total` | `number` (requerido) | — | Total de registros (no de páginas). |
| `pageSize` | `number` | `10` | |
| `currentPage` | `number` | `1` | |

| Output | Payload | Notas |
| --- | --- | --- |
| `pageChanged` | `number` | Ya clampeado a `[1, totalPages]`; no emite si no cambia. |

## Notas

- Más de 7 páginas: ventana `1 … (c-1, c, c+1) … última` con elipsis.
- Botones prev/next con `aria-label`; página activa con `aria-current="page"`.
