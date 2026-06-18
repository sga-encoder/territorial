import { CreateModel } from '../../core/http/create-model';
import { ResourceMapper } from '../../core/http/resource-mapper';
import { OfficialDto } from '../../models/official.dto';
import { Official } from '../../models/official.model';

/** Pure DTO ↔ model translation for Official (spec.md §2). */
export const officialMapper: ResourceMapper<OfficialDto, Official> = {
  toModel: (dto: OfficialDto): Official => ({
    id: dto.id_official,
    idEntity: dto.id_entity,
    name: dto.name,
    email: dto.email,
    phone: dto.phone,
    role: dto.role,
    status: dto.status,
    lastLatitude: dto.last_latitude,
    lastLongitude: dto.last_longitude,
    lastGpsUpdate: dto.last_gps_update,
    gpsActive: dto.gps_active,
  }),

  toDto: (model: Official | CreateModel<Official>): Omit<OfficialDto, 'id_official'> => ({
    id_entity: model.idEntity,
    name: model.name,
    email: model.email,
    phone: model.phone,
    role: model.role,
    status: model.status,
    last_latitude: model.lastLatitude,
    last_longitude: model.lastLongitude,
    last_gps_update: model.lastGpsUpdate,
    gps_active: model.gpsActive,
  }),
};
