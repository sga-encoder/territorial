import { CreateModel } from '../../core/http/create-model';
import { ResourceMapper } from '../../core/http/resource-mapper';
import { InterestedPartyDto } from '../../models/interested-party.dto';
import { InterestedParty } from '../../models/interested-party.model';

/** Pure DTO ↔ model translation for InterestedParty (spec.md §2). */
export const interestedPartyMapper: ResourceMapper<InterestedPartyDto, InterestedParty> = {
  toModel: (dto: InterestedPartyDto): InterestedParty => ({
    id: dto.id_interested_party,
    idEntity: dto.id_entity,
    idAnnotation: dto.id_annotation,
  }),

  toDto: (
    model: InterestedParty | CreateModel<InterestedParty>,
  ): Omit<InterestedPartyDto, 'id_interested_party'> => ({
    id_entity: model.idEntity,
    id_annotation: model.idAnnotation,
  }),
};
