# Icon — `<ui-icon>`

Wrapper tipado sobre `@ng-icons/lucide` (RN-UI-06): el kit expone el union
type `IconName` (subset curado) en lugar de los strings libres de la librería.

## Uso

```html
<ui-icon name="search" />
<ui-icon name="map-pin" size="lg" color="primary" />
<ui-icon name="success" color="success" />

<!-- Dentro de un botón hereda el color del texto (currentColor) -->
<ui-button variant="secondary">
  <ui-icon name="plus" size="sm" />
  Crear
</ui-button>
```

## API

| Input | Tipo | Default | Notas |
| --- | --- | --- | --- |
| `name` | `IconName` (requerido) | — | Autocompletado y validado en compilación. |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | 16/20/24px. |
| `color` | `'inherit' \| 'default' \| 'muted' \| 'primary' \| 'success' \| 'warning' \| 'danger' \| 'info'` | `'inherit'` | `inherit` sigue al contexto (currentColor). |

Nombres disponibles (`ICON_NAMES` exporta la lista para galerías): `calendar`,
`check`, `chevron-down`, `chevron-left`, `chevron-right`, `chevron-up`, `close`,
`edit`, `error`, `eye`, `eye-off`, `info`, `locate`, `map-pin`, `menu`, `minus`,
`more`, `moon`, `move`, `plus`, `save`, `search`, `success`, `sun`, `trash`,
`undo`, `user`, `warning`, `waypoints`.

## Cómo añadir un ícono

1. Importar el `lucide*` correspondiente en `components/ui/icon/icon.ts` y
   añadirlo a `ICON_SVGS`.
2. Ampliar el union type `IconName` en `components/ui/types.ts`.
   El compilador exige que mapa y tipo queden sincronizados.

## Accesibilidad

Los íconos son decorativos (`aria-hidden="true"`): la etiqueta accesible la
aporta siempre el componente que los contiene (botón, campo, etc.).
