/**
 * Backend contract for /api/cities — snake_case (confirmed via Postman).
 * Create/Update are plain JSON; GET responses use this shape.
 */
export interface CityDto {
  /** Backend primary key — serialized as `id_city`, not `id`. */
  readonly id_city: number;
  readonly id_department: number;
  readonly name: string;
  readonly dane_code: string;
}
