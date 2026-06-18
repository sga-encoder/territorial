/**
 * UI model for a department (camelCase), produced by `departmentMapper` from
 * DepartmentDto. Components only ever see this shape (spec.md §2). The backend
 * contract is plain JSON — no file, no parent relation, no status.
 */
export interface Department {
  readonly id: number;
  /** Department name (e.g. "Caldas"); unique system-wide (enforced by the backend). */
  readonly name: string;
  /** DANE administrative code (2 digits for departments, e.g. "17"). */
  readonly daneCode: string;
}
