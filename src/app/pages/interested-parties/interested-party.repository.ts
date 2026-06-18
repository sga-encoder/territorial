import { Injectable } from '@angular/core';
import { BaseRepository } from '../../core/http/base-repository';
import { InterestedPartyDto } from '../../models/interested-party.dto';
import { InterestedParty } from '../../models/interested-party.model';
import { interestedPartyMapper } from './interested-party.mapper';

const INTERESTED_PARTY_RESOURCE_PATH = 'interested-parties';

/** HTTP access to /api/interested-parties — plain JSON, generic BaseRepository. */
@Injectable({ providedIn: 'root' })
export class InterestedPartyRepository extends BaseRepository<InterestedPartyDto, InterestedParty> {
  constructor() {
    super(INTERESTED_PARTY_RESOURCE_PATH, interestedPartyMapper);
  }
}
