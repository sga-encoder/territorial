import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { BaseRepository } from '../../core/http/base-repository';
import { CreateModel } from '../../core/http/create-model';
import { FileUploadFormDataService } from '../../core/http/file-upload-form-data.service';
import { CategoryDto } from '../../models/category.dto';
import { Category } from '../../models/category.model';
import { categoryMapper } from './category.mapper';

const CATEGORY_RESOURCE_PATH = 'categories';

/**
 * HTTP access to /api/categories. Create/update use **multipart/form-data**
 * (snake_case fields + an optional image `file`), like Entity. They resolve to
 * `void`; the service re-reads the list after saving. GET verbs keep the generic
 * BaseRepository behaviour with the mapper.
 */
@Injectable({ providedIn: 'root' })
export class CategoryRepository extends BaseRepository<CategoryDto, Category> {
  private readonly http = inject(HttpClient);
  private readonly fileUploadFormDataService = inject(FileUploadFormDataService);

  constructor() {
    super(CATEGORY_RESOURCE_PATH, categoryMapper);
  }

  /** POST /api/categories — multipart/form-data (optional image `file`). */
  persistNew(model: CreateModel<Category>, file?: File): Observable<void> {
    return this.http
      .post(this.resourceUrl, this.toFormData(model, file))
      .pipe(map(() => undefined));
  }

  /** PUT /api/categories/{id} — multipart/form-data (optional new image `file`). */
  persistEdit(id: number, model: CreateModel<Category>, file?: File): Observable<void> {
    return this.http
      .put(`${this.resourceUrl}/${id}`, this.toFormData(model, file))
      .pipe(map(() => undefined));
  }

  /** Backend form fields (snake_case) + the raw image under `file`. The browser
   *  sets the multipart boundary, so no Content-Type header is added. */
  private toFormData(model: CreateModel<Category>, file?: File): FormData {
    return this.fileUploadFormDataService.toFormData(
      {
        id_parent_category: model.idParentCategory,
        name: model.name,
        description: model.description,
        status: model.status,
        image_url: model.imageUrl,
      },
      file,
    );
  }
}
