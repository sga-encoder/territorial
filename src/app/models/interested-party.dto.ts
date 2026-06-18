/** Backend contract for /api/interested-parties — snake_case. Plain JSON. */
export interface InterestedPartyDto {
  /** Backend primary key — serialized as `id_interested_party`, not `id`. */
  readonly id_interested_party: number;
  readonly id_entity: number;
  readonly id_annotation: number;
}
