# Polígono de barrio — agregado de solo lectura

Reconstruye en el frontend el **polígono que demarca un barrio** (spec.md RN-26,
CU-09/CU-10) a partir de los puntos que el backend ya persistió. El frontend **no
calcula geometría**: solo agrupa, ordena y valida los puntos.

> La **edición y el guardado** del polígono (crear/mover/eliminar/reordenar
> vértices y persistir con diff & sync) se documentan en
> [neighborhood-polygon-editor.md](neighborhood-polygon-editor.md). Este agregado
> es la base de solo lectura sobre la que se construye el editor.

## Por qué clases (y no el patrón interfaz + mapper)

El resto de recursos del proyecto son filas CRUD planas: interfaz `Model` +
`Dto` + `ResourceMapper` + `BaseRepository` (ver [crud-resources.md](crud-resources.md)).
El polígono es distinto: es un **agregado derivado** con comportamiento
(`isValid`, orden de vértices), no una fila. Por eso se modela con **clases**
inmutables. Se conserva, eso sí, la regla dura de spec.md §2: el DTO snake_case
**nunca sale** de la capa de datos — el servicio siempre devuelve la clase.

## Realidad del backend (importante)

- **No existe** `/api/neighborhoods/{id}/points`. Los vértices viven en la tabla
  compartida `points`, así que se consulta `GET /api/points/search?id_neighborhood={id}`.
- Sin `page`/`pageSize`, `/search` devuelve un **array plano** (igual supuesto que
  `BaseRepository.search`).
- Un punto pertenece a **un barrio O una anotación**, nunca ambos (constraint XOR
  `ck_point_xor_owner`). El polígono solo usa filas con `id_neighborhood`.
- La PK que serializa el backend es **`id_point`** (no `id`); `order` es nullable.

## Archivos

| Capa | Archivo |
| --- | --- |
| DTO | `models/polygon-point.dto.ts` (snake_case: `id_point`, `latitude`, `point_type`…) |
| Vértice (clase) | `models/polygon-point.ts` (`PolygonPoint` + `PolygonPoint.fromDto`; conserva `idPoint` para identificar la fila al guardar) |
| Agregado (clase) | `models/neighborhood-polygon.ts` (`NeighborhoodPolygon.fromPoints`) |
| Servicio | `pages/neighborhoods/neighborhood-polygon.service.ts` |

## `NeighborhoodPolygon`

| Miembro | Descripción |
| --- | --- |
| `idNeighborhood` | Id del barrio dueño del polígono. |
| `neighborhoodName` | Nombre del barrio (lo aporta el llamador; el endpoint de puntos no lo trae). |
| `points` | Vértices **ya ordenados** por `order` (los `null` van al final, orden estable). |
| `vertexCount` | Número de vértices. |
| `isValid` | `true` si hay **≥ 3 vértices** (`MINIMUM_POLYGON_VERTICES`). El anillo se asume cerrado implícitamente (RN-24), por lo que no se exige vértice de cierre. |

Construir el agregado **nunca falla**: un barrio sin puntos es un estado legítimo
("aún no demarcado", RN-18) que se refleja en `isValid`, no en una excepción. Los
errores de red sí se mapean a un mensaje claro vía `catchError`.

## Ejemplo de uso desde un componente

```ts
import { Component, inject, signal } from '@angular/core';
import { NeighborhoodPolygonService } from '../neighborhood-polygon.service';
import { NeighborhoodPolygon } from '../../../models/neighborhood-polygon';
import type { Neighborhood } from '../../../models/neighborhood.model';

@Component({
  selector: 'app-neighborhood-map',
  template: `
    @if (polygon(); as poly) {
      @if (poly.isValid) {
        <p>{{ poly.neighborhoodName }} — {{ poly.vertexCount }} vértices</p>
      } @else {
        <p>Este barrio aún no está demarcado.</p>
      }
    }
    @if (error()) {
      <p role="alert">{{ error() }}</p>
    }
  `,
})
export class NeighborhoodMapComponent {
  private readonly polygonService = inject(NeighborhoodPolygonService);

  protected readonly polygon = signal<NeighborhoodPolygon | null>(null);
  protected readonly error = signal<string | null>(null);

  loadPolygon(neighborhood: Neighborhood): void {
    this.polygonService.getPolygon(neighborhood).subscribe({
      next: (polygon) => this.polygon.set(polygon),
      error: (err: Error) => this.error.set(err.message),
    });
  }
}
```
