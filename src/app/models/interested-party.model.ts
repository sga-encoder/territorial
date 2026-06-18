/** UI model for an interested party — links an Entity to an Annotation. Plain JSON. */
export interface InterestedParty {
  readonly id: number;
  /** FK → Entity.id. */
  readonly idEntity: number;
  /** FK → Annotation.id. */
  readonly idAnnotation: number;
}
