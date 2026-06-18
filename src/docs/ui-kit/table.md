# Table — `<ui-table>`

Tabla de datos sobre superficie **glass**: el contenedor es translúcido con blur
(un solo `backdrop-filter` en el wrapper, nunca por fila → rendimiento) y las
filas usan tintes translúcidos con rayado sutil. Columnas y filas entran por input; el
render por defecto de una celda es texto (`String(row[key])`, `—` para
null/undefined) y cualquier columna puede sustituirlo con un **slot de celda**.

## Uso

```ts
protected readonly columns: readonly TableColumn[] = [
  { key: 'name', header: 'Nombre' },
  { key: 'status', header: 'Estado', align: 'center' },
  { key: 'points', header: 'Puntos', align: 'right' },
];
protected readonly rows: readonly TableRow[] = [
  { name: 'Alcaldía de Manizales', status: 'activa', points: 128 },
];
```

```html
<ui-table [columns]="columns" [rows]="rows" [loading]="loading()" emptyMessage="Sin entidades">
  <!-- Slot de celda: reemplaza el render de la columna cuyo key coincide -->
  <ng-template uiTableCell="status" let-row>
    <ui-badge [variant]="statusVariant(row)" size="sm">{{ row['status'] }}</ui-badge>
  </ng-template>
</ui-table>
```

## API

| Input | Tipo | Default | Notas |
| --- | --- | --- | --- |
| `columns` | `readonly TableColumn[]` (requerido) | — | `{ key, header, align? }` |
| `rows` | `readonly TableRow[]` (requerido) | — | `TableRow = Record<string, unknown>` |
| `loading` | `boolean` | `false` | Mantiene el header y muestra una fila con spinner. |
| `emptyMessage` | `string` | `'Sin registros'` | Cuando `rows` está vacío sin loading. |

Slots: `<ng-template uiTableCell="<key>" let-row>` — la fila llega como
contexto implícito (`TableCellContext`).

## Notas

- Superficie **glass** (excepción consciente a "solid donde se lee"): el blur va
  solo en el wrapper; las filas no llevan `backdrop-filter` (regla de perf).
- Pensada para componer con [Pagination](pagination.md) debajo y
  [EmptyState](empty-state.md) si el vacío amerita acción. Para acciones por fila
  usar un slot con [Dropdown](dropdown.md).
- `// TODO:` input `trackKey` para trackear filas por id en listas grandes
  (hoy trackea por índice).
