# Breadcrumbs — `<ui-breadcrumbs>`

Rastro de ubicación. Ítems con `path` son enlaces de router; el último ítem es
la página actual (`aria-current="page"`, sin enlace).

## Uso

```ts
protected readonly crumbs: readonly BreadcrumbItem[] = [
  { label: 'Inicio', path: '/' },
  { label: 'Entidades', path: '/entities' },
  { label: 'Alcaldía de Manizales' }, // sin path = página actual
];
```

```html
<ui-breadcrumbs [items]="crumbs" />
<ui-breadcrumbs [items]="crumbs" separator="chevron-right" />
```

## API

| Input | Tipo | Default | Notas |
| --- | --- | --- | --- |
| `items` | `readonly BreadcrumbItem[]` (requerido) | — | `{ label, path? }` |
| `separator` | `IconName` | `'chevron-right'` | Cualquier ícono del kit. |

## Accesibilidad

`<nav aria-label="Miga de pan">` + lista ordenada semántica (`<ol>`/`<li>`).
