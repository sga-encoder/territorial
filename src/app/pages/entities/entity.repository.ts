import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { BaseRepository } from '../../core/http/base-repository';
import { CreateModel } from '../../core/http/create-model';
import { FileUploadFormDataService } from '../../core/http/file-upload-form-data.service';
import { EntityDto } from '../../models/entity.dto';
import { Entity } from '../../models/entity.model';
import { entityMapper } from './entity.mapper';

const ENTITY_RESOURCE_PATH = 'entities';

/**
 * HTTP access to /api/entities. The backend create/update use **multipart/form-data**
 * (snake_case fields + an optional logo `file`), so they are sent here as FormData.
 * They resolve to `void` (the response body is not relied upon — it may be empty,
 * e.g. a 200 with no JSON on PUT); the service re-reads the list after saving.
 * GET verbs keep the generic `BaseRepository` behaviour with the mapper.
 */
@Injectable({ providedIn: 'root' })
export class EntityRepository extends BaseRepository<EntityDto, Entity> {
  private readonly http = inject(HttpClient);
  private readonly fileUploadFormDataService = inject(FileUploadFormDataService);

  constructor() {
    super(ENTITY_RESOURCE_PATH, entityMapper);
  }

  /** POST /api/entities — multipart/form-data (optional logo `file`). */
  persistNew(model: CreateModel<Entity>, file?: File): Observable<void> {
    return this.http
      .post(this.resourceUrl, this.toFormData(model, file))
      .pipe(map(() => undefined));
  }

  /** PUT /api/entities/{id} — multipart/form-data (optional new logo `file`). */
  persistEdit(id: number, model: CreateModel<Entity>, file?: File): Observable<void> {
    return this.http
      .put(`${this.resourceUrl}/${id}`, this.toFormData(model, file))
      .pipe(map(() => undefined));
  }

  /** Backend form fields (snake_case) + the raw image under `file`. The browser
   *  sets the multipart boundary, so no Content-Type header is added. */
  private toFormData(model: CreateModel<Entity>, file?: File): FormData {
    return this.fileUploadFormDataService.toFormData(
      {
        name: model.name,
        nit: model.nit,
        phone: model.phone,
        email: model.email,
        address: model.address,
        status: model.status,
        logo_url: model.logoUrl,
      },
      file,
    );
  }
}
