/** UI model for an annotation-category link (category ↔ annotation). Plain JSON. */
export interface AnnotationCategory {
  readonly id: number;
  /** FK → Category.id. */
  readonly idCategory: number;
  /** FK → Annotation.id. */
  readonly idAnnotation: number;
}
