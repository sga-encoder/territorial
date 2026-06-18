import { CreateModel } from '../../core/http/create-model';
import { ResourceMapper } from '../../core/http/resource-mapper';
import { AnnotationDto } from '../../models/annotation.dto';
import { Annotation } from '../../models/annotation.model';

/** Pure DTO ↔ model translation for Annotation (spec.md §2). */
export const annotationMapper: ResourceMapper<AnnotationDto, Annotation> = {
  toModel: (dto: AnnotationDto): Annotation => ({
    id: dto.id_annotation,
    idNeighborhood: dto.id_neighborhood,
    idCitizen: dto.id_citizen,
    description: dto.description,
    latitude: dto.latitude,
    longitude: dto.longitude,
    status: dto.status,
  }),

  toDto: (model: Annotation | CreateModel<Annotation>): Omit<AnnotationDto, 'id_annotation'> => ({
    id_neighborhood: model.idNeighborhood,
    id_citizen: model.idCitizen,
    description: model.description,
    latitude: model.latitude,
    longitude: model.longitude,
    status: model.status,
  }),
};
