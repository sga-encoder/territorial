import { CreateModel } from '../../core/http/create-model';
import { ResourceMapper } from '../../core/http/resource-mapper';
import { CityDto } from '../../models/city.dto';
import { City } from '../../models/city.model';

/** Pure DTO ↔ model translation for City (spec.md §2). */
export const cityMapper: ResourceMapper<CityDto, City> = {
  toModel: (dto: CityDto): City => ({
    id: dto.id_city,
    idDepartment: dto.id_department,
    name: dto.name,
    daneCode: dto.dane_code,
  }),

  toDto: (model: City | CreateModel<City>): Omit<CityDto, 'id_city'> => ({
    id_department: model.idDepartment,
    name: model.name,
    dane_code: model.daneCode,
  }),
};
