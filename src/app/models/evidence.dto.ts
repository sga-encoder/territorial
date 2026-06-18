import type { EvidenceType } from './evidence.model';

/**
 * Backend contract for /api/evidences — snake_case. Create/Update are sent as
 * `multipart/form-data` with the binary `file` (see evidence.repository.ts).
 */
export interface EvidenceDto {
  /** Backend primary key — serialized as `id_evidence`, not `id`. */
  readonly id_evidence: number;
  readonly id_annotation: number;
  readonly file_url: string;
  readonly file_type: EvidenceType;
  readonly file_size: number;
}
