/** Backend contract for /api/votes — snake_case. Plain JSON. */
export interface VoteDto {
  /** Backend primary key — serialized as `id_vote`, not `id`. */
  readonly id_vote: number;
  readonly id_citizen: number;
  readonly id_annotation: number;
  readonly stars: number;
  readonly comment: string;
}
