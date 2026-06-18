import { CreateModel } from '../../core/http/create-model';
import { ResourceMapper } from '../../core/http/resource-mapper';
import { AnnotationCategoryDto } from '../../models/annotation-category.dto';
import { AnnotationCategory } from '../../models/annotation-category.model';

/** Pure DTO ↔ model translation for AnnotationCategory (spec.md §2). */
export const annotationCategoryMapper: ResourceMapper<AnnotationCategoryDto, AnnotationCategory> = {
  toModel: (dto: AnnotationCategoryDto): AnnotationCategory => ({
    id: dto.id_annotation_category,
    idCategory: dto.id_category,
    idAnnotation: dto.id_annotation,
  }),

  toDto: (
    model: AnnotationCategory | CreateModel<AnnotationCategory>,
  ): Omit<AnnotationCategoryDto, 'id_annotation_category'> => ({
    id_category: model.idCategory,
    id_annotation: model.idAnnotation,
  }),
};
