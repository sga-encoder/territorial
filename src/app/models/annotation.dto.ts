import type { ActiveStatus } from '../pages/shared/status';

/** Backend contract for /api/annotations — snake_case. Plain JSON. */
export interface AnnotationDto {
  /** Backend primary key — serialized as `id_annotation`, not `id`. */
  readonly id_annotation: number;
  readonly id_neighborhood: number;
  readonly id_citizen: number;
  readonly description: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly status: ActiveStatus;
}
