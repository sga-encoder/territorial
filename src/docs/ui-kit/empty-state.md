# Empty State — `<ui-empty-state>`

Mensaje de vacío amistoso: ícono opcional, título, descripción y slot de
acción. Es transparente: toma la superficie de quien lo contiene (Card, página).

## Uso

```html
<ui-card>
  <ui-empty-state
    icon="search"
    title="Sin resultados"
    message="Ningún reporte coincide con los filtros aplicados."
  >
    <ui-button variant="secondary" size="sm">
      <ui-icon name="plus" size="sm" />
      Nuevo reporte
    </ui-button>
  </ui-empty-state>
</ui-card>
```

## API

| Input | Tipo | Default | Notas |
| --- | --- | --- | --- |
| `icon` | `IconName \| null` | `null` | |
| `title` | `string` (requerido) | — | |
| `message` | `string` | `''` | |

Slot por projection: la acción sugerida (normalmente un `<ui-button>`).
