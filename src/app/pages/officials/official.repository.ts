import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { BaseRepository } from '../../core/http/base-repository';
import { CreateModel } from '../../core/http/create-model';
import { OfficialDto } from '../../models/official.dto';
import { Official } from '../../models/official.model';
import { officialMapper } from './official.mapper';

const OFFICIAL_RESOURCE_PATH = 'officials';

/** JSON body for create/update — only the form-owned fields (snake_case). */
type OfficialWriteBody = Pick<
  OfficialDto,
  'id_entity' | 'name' | 'email' | 'phone' | 'role' | 'status' | 'gps_active'
>;

/**
 * HTTP access to /api/officials — plain JSON for the CRUD verbs, plus the two
 * live-tracking endpoints (`/tracking/start`, `/tracking/stop`) which are not
 * part of the generic 7-verb contract.
 *
 * create/update override the generic verbs to send ONLY the form-owned fields:
 * the GPS fix (`last_latitude/longitude`, and especially `last_gps_update`, a
 * backend DateTime) is owned by the tracking feature. Sending it from the form
 * 400s (SQLite rejects '' / a string for a DateTime), and omitting those keys
 * leaves the backend values untouched on edit.
 */
@Injectable({ providedIn: 'root' })
export class OfficialRepository extends BaseRepository<OfficialDto, Official> {
  private readonly http = inject(HttpClient);

  constructor() {
    super(OFFICIAL_RESOURCE_PATH, officialMapper);
  }

  /** POST /api/officials — JSON, form-owned fields only. */
  override create(model: CreateModel<Official>): Observable<Official> {
    return this.http
      .post<OfficialDto>(this.resourceUrl, this.toWriteBody(model))
      .pipe(map((dto) => officialMapper.toModel(dto)));
  }

  /** PUT /api/officials/{id} — JSON, form-owned fields only. */
  override update(id: number, model: Official): Observable<Official> {
    return this.http
      .put<OfficialDto>(`${this.resourceUrl}/${id}`, this.toWriteBody(model))
      .pipe(map((dto) => officialMapper.toModel(dto)));
  }

  private toWriteBody(model: CreateModel<Official>): OfficialWriteBody {
    return {
      id_entity: model.idEntity,
      name: model.name,
      email: model.email,
      phone: model.phone,
      role: model.role,
      status: model.status,
      gps_active: model.gpsActive,
    };
  }

  /** POST /api/officials/tracking/start — body `{ ids: number[] }`. */
  startTracking(ids: readonly number[]): Observable<void> {
    return this.http
      .post(`${this.resourceUrl}/tracking/start`, { ids })
      .pipe(map(() => undefined));
  }

  /** POST /api/officials/tracking/stop — stops the active tracking session. */
  stopTracking(): Observable<void> {
    return this.http.post(`${this.resourceUrl}/tracking/stop`, {}).pipe(map(() => undefined));
  }
}
