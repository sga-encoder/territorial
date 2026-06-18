import { HttpClient, HttpParams } from '@angular/common/http';
import { inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateModel } from './create-model';
import { Identifiable } from './identifiable';
import { ResourceMapper } from './resource-mapper';

/** Prefix shared by every backend endpoint (spec.md §3). */
export const API_PREFIX = '/api';

/** Filters accepted by the generic `/search` endpoint. */
export type SearchFilters = Readonly<Record<string, string | number | boolean>>;

/**
 * Generic repository implementing the 7-verb backend contract (spec.md §3).
 * Subclasses only provide the resource route and its mapper. Consumers always
 * receive UI models — DTOs never leave this layer (spec.md §2).
 */
export abstract class BaseRepository<TDto, TModel extends Identifiable> {
  private readonly httpClient = inject(HttpClient);
  protected readonly resourceUrl: string;

  protected constructor(
    resourcePath: string,
    private readonly mapper: ResourceMapper<TDto, TModel>,
  ) {
    this.resourceUrl = `${environment.baseUrl}${API_PREFIX}/${resourcePath}`;
  }

  /** GET /api/{resource} */
  listAll(): Observable<TModel[]> {
    return this.httpClient.get<TDto[]>(this.resourceUrl).pipe(map(this.toModels));
  }

  /**
   * GET /api/{resource}?page=&size=
   * TODO(spec §3): the pagination envelope is not documented — a plain array is
   * assumed until the backend response shape is confirmed.
   */
  listPaginated(page: number, size: number): Observable<TModel[]> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.httpClient.get<TDto[]>(this.resourceUrl, { params }).pipe(map(this.toModels));
  }

  /** GET /api/{resource}/{id} */
  getById(id: number): Observable<TModel> {
    return this.httpClient
      .get<TDto>(`${this.resourceUrl}/${id}`)
      .pipe(map((dto) => this.mapper.toModel(dto)));
  }

  /**
   * GET /api/{resource}/search
   * TODO(spec §3): filter parameter names per resource are not documented — confirm.
   */
  search(filters: SearchFilters): Observable<TModel[]> {
    let params = new HttpParams();
    for (const [filterName, filterValue] of Object.entries(filters)) {
      params = params.set(filterName, filterValue);
    }
    return this.httpClient
      .get<TDto[]>(`${this.resourceUrl}/search`, { params })
      .pipe(map(this.toModels));
  }

  /** POST /api/{resource} */
  create(model: CreateModel<TModel>): Observable<TModel> {
    return this.httpClient
      .post<TDto>(this.resourceUrl, this.mapper.toDto(model))
      .pipe(map((dto) => this.mapper.toModel(dto)));
  }

  /** PUT /api/{resource}/{id} */
  update(id: number, model: TModel): Observable<TModel> {
    return this.httpClient
      .put<TDto>(`${this.resourceUrl}/${id}`, this.mapper.toDto(model))
      .pipe(map((dto) => this.mapper.toModel(dto)));
  }

  /** DELETE /api/{resource}/{id} */
  delete(id: number): Observable<void> {
    return this.httpClient.delete<void>(`${this.resourceUrl}/${id}`);
  }

  private readonly toModels = (dtos: TDto[]): TModel[] =>
    dtos.map((dto) => this.mapper.toModel(dto));
}
