/** Evidence file type (UI union; the backend stores it as a free string). */
export type EvidenceType = 'image' | 'video' | 'document' | 'audio' | 'other';

/**
 * UI model for an evidence file attached to an annotation. Create/update go out
 * as multipart/form-data with the binary `file` (see evidence.repository.ts);
 * `fileUrl`/`fileSize` are filled by the backend from the uploaded file.
 */
export interface Evidence {
  readonly id: number;
  /** FK → Annotation.id. */
  readonly idAnnotation: number;
  readonly fileUrl: string;
  readonly fileType: EvidenceType;
  /** Size in bytes (assigned by the backend). */
  readonly fileSize: number;
}
