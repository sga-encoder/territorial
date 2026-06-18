import { CreateModel } from '../../core/http/create-model';
import { ResourceMapper } from '../../core/http/resource-mapper';
import { NeighborhoodDto } from '../../models/neighborhood.dto';
import { Neighborhood } from '../../models/neighborhood.model';

/** Pure DTO ↔ model translation for Neighborhood (spec.md §2). */
export const neighborhoodMapper: ResourceMapper<NeighborhoodDto, Neighborhood> = {
  toModel: (dto: NeighborhoodDto): Neighborhood => ({
    id: dto.id_neighborhood,
    idCommune: dto.id_commune,
    name: dto.name,
    status: dto.status,
  }),

  toDto: (model: Neighborhood | CreateModel<Neighborhood>): Omit<NeighborhoodDto, 'id_neighborhood'> => ({
    id_commune: model.idCommune,
    name: model.name,
    status: model.status,
  }),
};
