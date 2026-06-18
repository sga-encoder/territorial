import { Injectable } from '@angular/core';
import { BaseRepository } from '../../core/http/base-repository';
import { AnnotationCategoryDto } from '../../models/annotation-category.dto';
import { AnnotationCategory } from '../../models/annotation-category.model';
import { annotationCategoryMapper } from './annotation-category.mapper';

const ANNOTATION_CATEGORY_RESOURCE_PATH = 'annotation-categories';

/** HTTP access to /api/annotation-categories — plain JSON, generic BaseRepository. */
@Injectable({ providedIn: 'root' })
export class AnnotationCategoryRepository extends BaseRepository<
  AnnotationCategoryDto,
  AnnotationCategory
> {
  constructor() {
    super(ANNOTATION_CATEGORY_RESOURCE_PATH, annotationCategoryMapper);
  }
}
