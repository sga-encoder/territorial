# CRUD de recursos — réplica del patrón Entity

Todas las entidades del backend replican el patrón de referencia
[Entity](entity.md) (7 capas: model · dto · mapper · repository · service · lista ·
form-dialog modal). Este documento recoge **lo que comparten** y las variantes;
para el detalle de cada capa, ver [entity.md](entity.md).

## Recursos implementados

| Recurso | Ruta | Variante | Selects relacionales |
| --- | --- | --- | --- |
| Department | `/territory/departments` | JSON | — |
| City | `/territory/cities` | JSON | departamento |
| Commune | `/territory/communes` | JSON + estado | ciudad |
| Neighborhood | `/territory/neighborhoods` | JSON + estado | comuna |
| Citizen | `/citizens` | JSON + coords | — |
| Category | `/categories` | **multipart** + auto-padre | categoría (padre opcional) |
| Annotation | `/annotations` | JSON + coords | barrio + ciudadano |
| Interested Party | `/interested-parties` | JSON relacional | entidad + anotación |
| Annotation Category | `/annotation-categories` | JSON relacional | categoría + anotación |
| Vote | `/votes` | JSON + estrellas | ciudadano + anotación |
| Evidence | `/evidences` | **multipart** | anotación |
| Official | `/officials` | JSON + tracking | entidad |

## Llave primaria: `id_<recurso>`, no `id` (gotcha)

El backend serializa la PK con el nombre del recurso (`id_department`, `id_city`,
`id_commune`, `id_neighborhood`, `id_entity`, `id_official`, `id_citizen`,
`id_category`, `id_annotation`, `id_vote`, `id_evidence`, `id_interested_party`,
`id_annotation_category`) — **nunca `id`** (igual que `id_point`). Por eso:

- Cada **DTO** declara su PK real (`id_<recurso>`), no `id`.
- El **mapper** la traduce a `id` del modelo: `toModel: (dto) => ({ id: dto.id_<recurso>, … })`
  y `toDto` la omite: `Omit<XDto, 'id_<recurso>'>` (el backend la asigna).
- El **modelo** UI sí expone `id` (camelCase). Solo el modelo cumple `Identifiable`;
  el genérico `ResourceMapper<TDto, TModel>` ya **no** exige `TDto extends Identifiable`.

Leer `dto.id` (inexistente) deja `model.id` en `undefined` y rompe en silencio la
resolución del padre en tablas (`toLabelMap`) y el editar/eliminar (`PUT/DELETE /{id}`).

## Dos variantes de repositorio

1. **JSON (mayoría):** `extends BaseRepository` sin overrides. `create`/`update`
   genéricos usan el `mapper.toDto`. El service llama `repository.create/update`.
2. **multipart (Category, Evidence, igual que Entity):** el repositorio
   sobreescribe `persistNew`/`persistEdit` enviando `FormData` (campos snake_case
   + binario en `file`); resuelven a `void` y el service recarga la lista.

### Regla de categorías (padre)

- Solo una **categoría raíz** puede ser padre.
- Una **subcategoría** (categoría con `idParentCategory`) no puede tener hijas.

## Infraestructura compartida (`pages/shared/`)

- **`confirm-dialog.ts`** — diálogo de confirmación accesible (reemplaza
  `confirm()`); lo abren todos los `remove()` vía `ModalService`. (Relocalizado
  aquí desde `pages/entities`.)
- **`reference-options.ts`** — `toFieldOptions(items, label)` construye las
  `FieldOption[]` de un select relacional (**valor = `String(id)`**, porque
  `ui-select` compara con `===`) y `toLabelMap(items, label)` el mapa id→nombre
  para resolver el padre en cada fila de la tabla.
- **`status.ts`** — unión `ActiveStatus = 'active' | 'inactive'`,
  `ACTIVE_STATUS_OPTIONS` (select) y `STATUS_BADGE_CONFIG` (badge de la tabla).

## Patrón de select relacional (la clave de 8 recursos)

1. La **lista** inyecta el/los service(s) padre y los carga en el constructor
   (solo navegador). Construye `toLabelMap` para mostrar el nombre del padre en
   cada fila, y opciones de filtro a partir del padre.
2. Antes de abrir el modal (`openCreate`/`openEdit`) se hace `ensure…Loaded()`
   para garantizar que las opciones existen → el `schema` del form se computa una
   sola vez ya poblado (sin parpadeo de reconstrucción del `FormGroup`).
3. El **form-dialog** inyecta el service padre y construye `options` con
   `toFieldOptions` dentro del `schema` (`computed`). `initialValue` del select es
   `String(model.idX)`; al enviar se hace `Number(value['idX'])`.

## Números y coordenadas

El form-generator **no tiene tipo `number`**. Las estrellas de Vote usan
`type: 'range'` (min 1, max 5) que ya emite `number`.

**Ubicación geográfica:** cuando las coordenadas son un *pin* (Citizen, RN-10) se
usa el campo `type: 'location'` (`<ui-map-point-picker>`: mapa + búsqueda de
dirección), cuyo valor es `"lat,lng"` y se parte con `.split(',').map(Number)` al
enviar — nunca se teclean a mano. Ver [map-point-picker.md](map-point-picker.md).
Donde la coordenada es solo un número suelto puede seguir usándose `type: 'text'`
con `pattern: '^-?\\d+(\\.\\d+)?$'` y `Number()` al enviar.

## Tablas: columnas derivadas

Celdas calculadas en el `rows` computed de la lista: coordenadas (`"lat, lng"`),
estrellas (`★★★☆☆`), nombre del padre resuelto por `toLabelMap`. El tipo de celda
`badge`/`boolean`/`number` del `<ui-dynamic-table>` se configura con `typeConfig`.

## Official — tracking en vivo

`OfficialRepository` añade `startTracking(ids)` y `stopTracking()` (POST a
`/api/officials/tracking/{start,stop}`, fuera del contrato de 7 verbos). La lista
expone dos acciones de cabecera: **Iniciar seguimiento** abre
`OfficialTrackingDialog` (un `<ui-dynamic-table selectionMode="multiple">` que
resuelve el modal con los `ids` elegidos) y **Detener seguimiento** confirma y
llama `stopTracking()`. `OfficialService.isTracking()` alimenta el estado
`loading` de los botones.

## Documentación específica

- [department.md](department.md) — el caso JSON más simple (con punto de extensión
  de validación del código DANE).
- [reports.md](reports.md) — el panel de Reportes (no es CRUD).
