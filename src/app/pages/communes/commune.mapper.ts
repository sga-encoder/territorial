import { CreateModel } from '../../core/http/create-model';
import { ResourceMapper } from '../../core/http/resource-mapper';
import { CommuneDto } from '../../models/commune.dto';
import { Commune } from '../../models/commune.model';

/** Pure DTO ↔ model translation for Commune (spec.md §2). */
export const communeMapper: ResourceMapper<CommuneDto, Commune> = {
  toModel: (dto: CommuneDto): Commune => ({
    id: dto.id_commune,
    idCity: dto.id_city,
    name: dto.name,
    status: dto.status,
  }),

  toDto: (model: Commune | CreateModel<Commune>): Omit<CommuneDto, 'id_commune'> => ({
    id_city: model.idCity,
    name: model.name,
    status: model.status,
  }),
};
