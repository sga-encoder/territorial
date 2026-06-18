import { CreateModel } from '../../core/http/create-model';
import { ResourceMapper } from '../../core/http/resource-mapper';
import { EvidenceDto } from '../../models/evidence.dto';
import { Evidence } from '../../models/evidence.model';

/**
 * Pure DTO ↔ model translation for Evidence. create/update go out as multipart
 * (evidence.repository.ts); `toDto` is kept for the GET response shape.
 */
export const evidenceMapper: ResourceMapper<EvidenceDto, Evidence> = {
  toModel: (dto: EvidenceDto): Evidence => ({
    id: dto.id_evidence,
    idAnnotation: dto.id_annotation,
    fileUrl: dto.file_url,
    fileType: dto.file_type,
    fileSize: dto.file_size,
  }),

  toDto: (model: Evidence | CreateModel<Evidence>): Omit<EvidenceDto, 'id_evidence'> => ({
    id_annotation: model.idAnnotation,
    file_url: model.fileUrl,
    file_type: model.fileType,
    file_size: model.fileSize,
  }),
};
