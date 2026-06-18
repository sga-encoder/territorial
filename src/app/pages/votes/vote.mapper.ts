import { CreateModel } from '../../core/http/create-model';
import { ResourceMapper } from '../../core/http/resource-mapper';
import { VoteDto } from '../../models/vote.dto';
import { Vote } from '../../models/vote.model';

/** Pure DTO ↔ model translation for Vote (spec.md §2). */
export const voteMapper: ResourceMapper<VoteDto, Vote> = {
  toModel: (dto: VoteDto): Vote => ({
    id: dto.id_vote,
    idCitizen: dto.id_citizen,
    idAnnotation: dto.id_annotation,
    stars: dto.stars,
    comment: dto.comment,
  }),

  toDto: (model: Vote | CreateModel<Vote>): Omit<VoteDto, 'id_vote'> => ({
    id_citizen: model.idCitizen,
    id_annotation: model.idAnnotation,
    stars: model.stars,
    comment: model.comment,
  }),
};
