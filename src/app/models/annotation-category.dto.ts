/** Backend contract for /api/annotation-categories — snake_case. Plain JSON. */
export interface AnnotationCategoryDto {
  /** Backend primary key — serialized as `id_annotation_category`, not `id`. */
  readonly id_annotation_category: number;
  readonly id_category: number;
  readonly id_annotation: number;
}
