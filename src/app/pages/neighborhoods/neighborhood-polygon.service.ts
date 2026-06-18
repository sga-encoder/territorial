import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, forkJoin, map, Observable, of, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { API_PREFIX } from '../../core/http/base-repository';
import { NeighborhoodPolygon } from '../../models/neighborhood-polygon';
import type { Neighborhood } from '../../models/neighborhood.model';
import { PolygonPoint } from '../../models/polygon-point';
import type { PolygonPointDto } from '../../models/polygon-point.dto';
import { diffPolygonPoints } from './polygon-editor/polygon-geometry';
import type { EditableVertex, OrderedVertex } from './polygon-editor/polygon-editor.types';

const POLYGON_LOAD_ERROR_MESSAGE =
  'No fue posible cargar el polígono del barrio. Verifica que el backend esté disponible.';
const POLYGON_SAVE_ERROR_MESSAGE =
  'No fue posible guardar el polígono. Revisa los vértices e intenta de nuevo.';

/**
 * Default `point_type` for vertices created in the editor. The column is an
 * unconstrained String(40) (spec.md §3) and the vocabulary is not fixed, so a
 * neutral marker keeps every polygon vertex consistent; existing vertices keep
 * their original type on update.
 */
const DEFAULT_POINT_TYPE = 'vertex';

/** Body sent to POST /api/points for a new polygon vertex (snake_case, spec.md §3). */
interface CreatePointDto {
  readonly id_neighborhood: number;
  /** Always null: a polygon vertex never belongs to an annotation (XOR constraint). */
  readonly id_annotation: null;
  readonly latitude: number;
  readonly longitude: number;
  readonly order: number;
  readonly point_type: string;
}

/** Body sent to PUT /api/points/{id} — the create shape plus the row id. */
interface UpdatePointDto extends CreatePointDto {
  readonly id_point: number;
}

/**
 * Reads and writes the polygon that demarcates a neighborhood (spec.md RN-26,
 * CU-09/CU-10).
 *
 * There is no dedicated polygon endpoint: vertices live in the shared `points`
 * table, so reads query `GET /api/points/search?id_neighborhood={id}` and writes
 * use the standard CRUD verbs on `/api/points`. DTOs never escape this layer —
 * callers pass/receive domain shapes only (spec.md §2).
 */
@Injectable({ providedIn: 'root' })
export class NeighborhoodPolygonService {
  private readonly httpClient = inject(HttpClient);
  private readonly pointsUrl = `${environment.baseUrl}${API_PREFIX}/points`;
  /**
   * TODO(spec §3): `/search` is assumed to return a plain array (no `page`/`pageSize`
   * sent), matching BaseRepository. Confirm once the envelope is documented.
   */
  private readonly pointsSearchUrl = `${this.pointsUrl}/search`;

  /**
   * Builds the polygon for one neighborhood. The name is taken from the model the
   * caller already holds, since the points endpoint does not return it.
   */
  getPolygon(neighborhood: Neighborhood): Observable<NeighborhoodPolygon> {
    const params = new HttpParams().set('id_neighborhood', neighborhood.id);
    return this.httpClient.get<PolygonPointDto[]>(this.pointsSearchUrl, { params }).pipe(
      map((dtos) => dtos.map(PolygonPoint.fromDto)),
      map((points) => NeighborhoodPolygon.fromPoints(neighborhood.id, neighborhood.name, points)),
      catchError(() => throwError(() => new Error(POLYGON_LOAD_ERROR_MESSAGE))),
    );
  }

  /**
   * Persists the edited ring with the "diff & sync" strategy: only the vertices
   * that actually changed are written. New vertices are POSTed, moved/reordered
   * ones are PUT, and removed ones are DELETEd; unchanged vertices cost nothing.
   * Completes once every request resolves — callers should then re-read the
   * polygon to pick up the server-assigned `id_point`s of the new vertices.
   */
  savePolygon(
    neighborhood: Neighborhood,
    baseline: readonly PolygonPoint[],
    edited: readonly EditableVertex[],
  ): Observable<void> {
    const diff = diffPolygonPoints(baseline, edited);
    const pointTypeById = new Map(baseline.map((point) => [point.idPoint, point.pointType]));
    const requests: Observable<unknown>[] = [];

    for (const vertex of diff.toCreate) {
      requests.push(this.httpClient.post(this.pointsUrl, this.toCreateDto(neighborhood.id, vertex)));
    }
    for (const vertex of diff.toUpdate) {
      // diff guarantees a non-null idPoint here; guard keeps the types honest.
      if (vertex.idPoint === null) {
        continue;
      }
      const pointType = pointTypeById.get(vertex.idPoint) ?? DEFAULT_POINT_TYPE;
      const body: UpdatePointDto = {
        ...this.toCreateDto(neighborhood.id, vertex, pointType),
        id_point: vertex.idPoint,
      };
      requests.push(this.httpClient.put(`${this.pointsUrl}/${vertex.idPoint}`, body));
    }
    for (const idPoint of diff.toDelete) {
      requests.push(this.httpClient.delete(`${this.pointsUrl}/${idPoint}`));
    }

    if (requests.length === 0) {
      return of(undefined);
    }
    return forkJoin(requests).pipe(
      map(() => undefined),
      catchError(() => throwError(() => new Error(POLYGON_SAVE_ERROR_MESSAGE))),
    );
  }

  private toCreateDto(
    idNeighborhood: number,
    vertex: OrderedVertex,
    pointType: string = DEFAULT_POINT_TYPE,
  ): CreatePointDto {
    return {
      id_neighborhood: idNeighborhood,
      id_annotation: null,
      latitude: vertex.latitude,
      longitude: vertex.longitude,
      order: vertex.order,
      point_type: pointType,
    };
  }
}
