# Page Header — `<ui-page-header>`

Encabezado de página: **título** (+ **subtítulo** opcional silenciado) a un lado y
una fila de **botones de acción configurables** al otro. Los botones se declaran
como **datos** (`actions`): cada entrada lleva su propio callback `run` (mismo
patrón que `DynamicRowAction`), así que agregar un botón es un cambio de config,
nunca de plantilla.

Compone solo el kit (RN-UI-02) y vive en la capa `dynamic` por ser una
composición data-driven, no un átomo de estilo (RN-UI-05).

## Uso

```html
<ui-page-header title="Entidades" [subtitle]="subtitle()" [actions]="headerActions" />
```

```ts
import { PageHeader } from '../../../components/dynamic';
import type { PageHeaderAction } from '../../../components/dynamic';

@Component({
  imports: [PageHeader /* … */],
})
export class EntityList {
  protected readonly subtitle = computed(
    () => `Administración de entidades (${this.entityService.totalEntities()} registradas).`,
  );

  // El "diccionario": amplía el arreglo para añadir más botones.
  protected readonly headerActions: readonly PageHeaderAction[] = [
    { id: 'new', label: 'Nueva entidad', icon: 'plus', run: () => this.openCreate() },
    { id: 'import', label: 'Importar', icon: 'plus', variant: 'secondary', run: () => this.importCsv() },
  ];
}
```

## API

| Input | Tipo | Default | Notas |
| --- | --- | --- | --- |
| `title` | `string` | — (requerido) | Texto del encabezado. |
| `subtitle` | `string \| null` | `null` | Línea silenciada bajo el título; se oculta si es `null`/vacío. |
| `level` | `TitleLevel` (`1…6`) | `1` | Semántica + escala del `<ui-title>`. |
| `actions` | `readonly PageHeaderAction[]` | `[]` | Diccionario de botones a la derecha. |

### `PageHeaderAction`

| Campo | Tipo | Default | Notas |
| --- | --- | --- | --- |
| `id` | `string` | — | Clave estable para `@for` (`track`). |
| `label` | `string` | — | Texto visible del botón. |
| `icon` | `IconName` | — | Ícono opcional a la izquierda del label. |
| `variant` | `ButtonVariant` | `primary` | Estilo del botón del kit. |
| `disabled` | `boolean` | `false` | Deshabilita el botón. |
| `loading` | `boolean` | `false` | Muestra spinner y bloquea la interacción. |
| `run` | `() => void` | — | Se invoca al presionar (solo dispara si está operable). |

## Decisiones técnicas

- **Botones como datos (no slots):** el diccionario `actions` con `run` inline
  replica `DynamicRowAction`, así una página añade botones extendiendo el arreglo.
- **Subtítulo como string:** el conteo en vivo se resuelve con un `computed()` en
  el consumidor y se pasa ya formateado — el header se mantiene tonto.
- **Layout heredado del kit:** reusa `<ui-container>` (`justify="between"`,
  `wrap`) — sin utilidades sueltas fuera del kit (RN-UI-02).
