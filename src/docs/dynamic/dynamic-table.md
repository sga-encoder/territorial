# Dynamic Table — `<ui-dynamic-table>`

Tabla dirigida por configuración. Envuelve [`<ui-table>`](../ui-kit/table.md) y
[`<ui-pagination>`](../ui-kit/pagination.md) y añade tres cosas que el átomo no
trae: **render tipado de celdas**, **selección** (radio/checkbox, vía
`ControlValueAccessor`) y una **columna de acciones**. Internamente inyecta dos
columnas sintéticas (`__select__`, `__actions__`) en la tabla tonta y proyecta
una plantilla de celda por columna.

## Uso

```ts
protected readonly columns: readonly DynamicColumn[] = [
  { key: 'name', header: 'Entidad' },
  {
    key: 'status', header: 'Estado', align: 'center', type: 'badge',
    typeConfig: { badgeVariants: { activa: 'success', inactiva: 'neutral' } },
  },
  { key: 'createdAt', header: 'Registro', type: 'date', typeConfig: { dateStyle: 'medium' } },
  { key: 'points', header: 'Puntos', align: 'right', type: 'number' },
];
protected readonly rows: readonly TableRow[] = [
  { id: 1, name: 'Alcaldía de Manizales', status: 'activa', createdAt: '2026-01-15', points: 128 },
];
protected readonly actions: readonly DynamicRowAction[] = [
  { id: 'edit', icon: 'edit', label: 'Editar', color: 'info', run: (row) => this.edit(row) },
  { id: 'delete', icon: 'trash', label: 'Eliminar', color: 'danger', run: (row) => this.remove(row) },
];
```

```html
<ui-dynamic-table
  [columns]="columns"
  [rows]="rows"
  [actions]="actions"
  selectionMode="multiple"
  rowKey="id"
  [pageSize]="10"
  (selectionChange)="onSelection($event)"
/>
```

También funciona como control de formulario (`[formControl]` / `formControlName`):
el valor es la fila seleccionada (`single`) o el array de filas (`multiple`).

## API

| Input | Tipo | Default | Notas |
| --- | --- | --- | --- |
| `columns` | `readonly DynamicColumn[]` (requerido) | — | `TableColumn` + `type` + `typeConfig`. |
| `rows` | `readonly TableRow[]` (requerido) | — | `Record<string, unknown>`. |
| `actions` | `readonly DynamicRowAction[]` | `[]` | Columna final de botones ghost icon-only. |
| `loading` | `boolean` | `false` | Delegado a `<ui-table>`. |
| `emptyMessage` | `string` | `'Sin registros'` | Cuando no hay filas. |
| `selectionMode` | `'none' \| 'single' \| 'multiple'` | `'none'` | Radio / checkbox por fila. |
| `rowKey` | `string \| null` | `null` | Campo identidad; sin él se compara por referencia. |
| `rowLabel` | `(row) => string \| null` | `null` | Nombre accesible del selector de fila. |
| `paginated` | `boolean` | `true` | Paginación interna (slicing en cliente). |
| `pageSize` | `number` | `10` | Filas por página. |
| `groupBy` | `string \| null` | `null` | Agrupa por el valor de esa columna y añade cabeceras expandibles. |
| `groupsExpandedByDefault` | `boolean` | `true` | Estado inicial de grupos; en `false` arrancan colapsados. |
| `selectionBaseKey` | `string \| null` | `null` | Identidad de selección alternativa (útil con filas agrupadas/sintéticas). |

| Output | Tipo | Cuándo |
| --- | --- | --- |
| `selectionChange` | `TableRow \| readonly TableRow[] \| null` | Al cambiar la selección. |

Implementa `ControlValueAccessor`: la selección es también el valor del control.

## Tipos de celda (`DynamicCellType`)

`text` (default) · `number` (Intl, locale es-CO) · `date` (Intl, `dateStyle`
short/medium/long) · `badge` y `chip` (mapean el valor crudo a variante vía
`typeConfig.badgeVariants` / `chipVariants`, fallback `neutral`) · `boolean`
(`Sí`/`No`, configurable con `booleanLabels`). Vacío/nulo → `—`.

## Notas

- **Identidad y selección:** `rowKey` permite que una selección sobreviva a la
  paginación. En `single`, reclicar la fila activa la deselecciona (toggle-off);
  para hacerlo «pegajoso» como un radio normal, ajusta `toggleSelection`.
- **Paginación:** barra inferior con la **información a la izquierda** (rango
  "1–10 de 42", o el resumen de selección si hay) y el **control de paginación
  siempre a la derecha**.
- **Agrupación:** con `groupBy`, la tabla inserta una fila cabecera por grupo y
  permite expandir/colapsar con un botón de chevron. Los grupos arrancan
  expandidos por defecto.
- **Accesibilidad:** radios/checkbox **personalizados** (visual del kit, patrón
  `peer`) con `aria-label` por fila; botones de acción icon-only con texto
  `sr-only` (los `<ui-icon>` son decorativos).
- **Composición:** ningún estilo propio de color/superficie — todo sale del kit.
  Pensada para reemplazar tablas crudas de features (p. ej. `entity-list`).
