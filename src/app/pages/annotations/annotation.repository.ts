import { Injectable } from '@angular/core';
import { BaseRepository } from '../../core/http/base-repository';
import { AnnotationDto } from '../../models/annotation.dto';
import { Annotation } from '../../models/annotation.model';
import { annotationMapper } from './annotation.mapper';

const ANNOTATION_RESOURCE_PATH = 'annotations';

/** HTTP access to /api/annotations — plain JSON, generic BaseRepository. */
@Injectable({ providedIn: 'root' })
export class AnnotationRepository extends BaseRepository<AnnotationDto, Annotation> {
  constructor() {
    super(ANNOTATION_RESOURCE_PATH, annotationMapper);
  }
}
