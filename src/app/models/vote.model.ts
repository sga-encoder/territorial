/** UI model for a vote — a citizen's star rating + comment on an annotation. JSON. */
export interface Vote {
  readonly id: number;
  /** FK → Citizen.id. */
  readonly idCitizen: number;
  /** FK → Annotation.id. */
  readonly idAnnotation: number;
  /** Rating from 1 to 5. */
  readonly stars: number;
  readonly comment: string;
}
