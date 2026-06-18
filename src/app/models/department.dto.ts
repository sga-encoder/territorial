/**
 * Backend contract for /api/departments — snake_case (confirmed via Postman).
 * Create/Update are plain JSON (no multipart); GET responses use this shape.
 */
export interface DepartmentDto {
  /** Backend primary key — serialized as `id_department`, not `id`. */
  readonly id_department: number;
  readonly name: string;
  readonly dane_code: string;
}
