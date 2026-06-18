import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { BaseRepository } from '../../core/http/base-repository';
import { CreateModel } from '../../core/http/create-model';
import { FileUploadFormDataService } from '../../core/http/file-upload-form-data.service';
import { EvidenceDto } from '../../models/evidence.dto';
import { Evidence } from '../../models/evidence.model';
import { evidenceMapper } from './evidence.mapper';

const EVIDENCE_RESOURCE_PATH = 'evidences';

/**
 * HTTP access to /api/evidences. Create/update use **multipart/form-data** (the
 * binary lives in `file`; the backend derives `file_url`/`file_size`). They
 * resolve to `void`; the service re-reads the list after saving.
 */
@Injectable({ providedIn: 'root' })
export class EvidenceRepository extends BaseRepository<EvidenceDto, Evidence> {
  private readonly http = inject(HttpClient);
  private readonly fileUploadFormDataService = inject(FileUploadFormDataService);

  constructor() {
    super(EVIDENCE_RESOURCE_PATH, evidenceMapper);
  }

  /** POST /api/evidences — multipart/form-data (binary `file`). */
  persistNew(model: CreateModel<Evidence>, file?: File): Observable<void> {
    return this.http.post(this.resourceUrl, this.toFormData(model, file)).pipe(map(() => undefined));
  }

  /** PUT /api/evidences/{id} — multipart/form-data (optional new `file`). */
  persistEdit(id: number, model: CreateModel<Evidence>, file?: File): Observable<void> {
    return this.http
      .put(`${this.resourceUrl}/${id}`, this.toFormData(model, file))
      .pipe(map(() => undefined));
  }

  /** Backend form fields (snake_case) + the raw binary under `file`. The browser
   *  sets the multipart boundary, so no Content-Type header is added. */
  private toFormData(model: CreateModel<Evidence>, file?: File): FormData {
    return this.fileUploadFormDataService.toFormData(
      {
        id_annotation: model.idAnnotation,
        file_type: model.fileType,
        file_url: model.fileUrl,
        file_size: model.fileSize,
      },
      file,
    );
  }
}
