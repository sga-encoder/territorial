# Filter — `<ui-filter>`

Barra de filtros compacta dirigida por configuración. Construye un Reactive Form
a partir de `config`, corre un **pipeline local** sobre `data` y emite la
colección filtrada (`filteredChange`) — pensada para enchufarse directo a un
[`<ui-dynamic-table>`](dynamic-table.md).

## Uso

```ts
protected readonly config: FilterConfig = {
  fields: [
    { key: 'name', label: 'Buscar', type: 'text', matchMode: 'contains', placeholder: 'Nombre' },
    { key: 'status', label: 'Estado', type: 'select', matchMode: 'equals',
      options: [{ value: 'active', label: 'Activa' }, { value: 'inactive', label: 'Inactiva' }] },
  ],
};
protected readonly filtered = signal<readonly TableRow[]>([]);
```

```html
<ui-filter [config]="config" [data]="rows()" (filteredChange)="filtered.set($event)" />
<ui-dynamic-table [columns]="columns" [rows]="filtered()" />
```

## API

| Input | Tipo | Default | Notas |
| --- | --- | --- | --- |
| `config` | `FilterConfig` (requerido) | — | `{ fields: FilterFieldConfig[] }`. |
| `data` | `readonly TableRow[]` (requerido) | — | Colección cruda a filtrar. |
| `mode` | `'auto' \| 'manual'` | `'auto'` | `auto` filtra en vivo (debounced); `manual` con el botón Filtrar. |
| `debounce` | `number` | `250` | Milisegundos en modo `auto`. |

| Output | Tipo | Cuándo |
| --- | --- | --- |
| `filteredChange` | `readonly TableRow[]` | Al iniciar, al cambiar `data`, y en cada filtrado. |

## Campos y match modes

`FilterFieldType`: `text` · `select` · `date` · `checkbox`. Cada campo declara su
`matchMode`:

| matchMode | Comparación (valor del filtro vs `row[key]`) |
| --- | --- |
| `contains` | la celda contiene el texto (case-insensitive) |
| `equals` | igualdad por texto |
| `gte` / `lte` | mayor-igual / menor-igual (numérico si ambos lo son, si no lexicográfico) |
| `in` | la celda está en el array de valores |

Un valor vacío (`null`, `''`, `false`) significa **sin restricción** para ese campo.

## Notas

- **Botones:** «Limpiar» siempre (resetea y re-emite); «Filtrar» solo en modo
  `manual`. En `auto`, escribir/elegir filtra solo (Enter también aplica).
- **Reactivo a la fuente:** si `data` cambia (p. ej. recarga del backend), re-emite
  aplicando los filtros vigentes — ideal junto a un servicio con signals.
- **Composición:** usa los controles CVA del kit; el único Tailwind propio es el
  grid responsive de los campos.
