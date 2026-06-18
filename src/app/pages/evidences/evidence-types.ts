import type { FieldOption } from '../../components/ui';
import type { EvidenceType } from '../../models/evidence.model';

/** Spanish label per evidence type — used by the table badge and the select. */
export const EVIDENCE_TYPE_LABELS: Readonly<Record<EvidenceType, string>> = {
  image: 'Imagen',
  video: 'Video',
  document: 'Documento',
  audio: 'Audio',
  other: 'Otro',
};

/** Select options for the evidence `file_type` field. */
export const EVIDENCE_TYPE_OPTIONS: readonly FieldOption[] = (
  Object.keys(EVIDENCE_TYPE_LABELS) as EvidenceType[]
).map((type) => ({ value: type, label: EVIDENCE_TYPE_LABELS[type] }));
