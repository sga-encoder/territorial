import { Injectable } from '@angular/core';
import { BaseRepository } from '../../core/http/base-repository';
import { VoteDto } from '../../models/vote.dto';
import { Vote } from '../../models/vote.model';
import { voteMapper } from './vote.mapper';

const VOTE_RESOURCE_PATH = 'votes';

/** HTTP access to /api/votes — plain JSON, generic BaseRepository. */
@Injectable({ providedIn: 'root' })
export class VoteRepository extends BaseRepository<VoteDto, Vote> {
  constructor() {
    super(VOTE_RESOURCE_PATH, voteMapper);
  }
}
