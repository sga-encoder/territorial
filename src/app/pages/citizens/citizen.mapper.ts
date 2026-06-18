import { CreateModel } from '../../core/http/create-model';
import { ResourceMapper } from '../../core/http/resource-mapper';
import { CitizenDto } from '../../models/citizen.dto';
import { Citizen } from '../../models/citizen.model';

/** Pure DTO ↔ model translation for Citizen (spec.md §2). */
export const citizenMapper: ResourceMapper<CitizenDto, Citizen> = {
  toModel: (dto: CitizenDto): Citizen => ({
    id: dto.id_citizen,
    name: dto.name,
    email: dto.email,
    phone: dto.phone,
    address: dto.address,
    latitude: dto.latitude,
    longitude: dto.longitude,
    status: dto.status,
  }),

  toDto: (model: Citizen | CreateModel<Citizen>): Omit<CitizenDto, 'id_citizen'> => ({
    name: model.name,
    email: model.email,
    phone: model.phone,
    address: model.address,
    latitude: model.latitude,
    longitude: model.longitude,
    status: model.status,
  }),
};
