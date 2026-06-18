import { Injectable } from '@angular/core';
import { BaseRepository } from '../../core/http/base-repository';
import { CitizenDto } from '../../models/citizen.dto';
import { Citizen } from '../../models/citizen.model';
import { citizenMapper } from './citizen.mapper';

const CITIZEN_RESOURCE_PATH = 'citizens';

/** HTTP access to /api/citizens — plain JSON, generic BaseRepository. */
@Injectable({ providedIn: 'root' })
export class CitizenRepository extends BaseRepository<CitizenDto, Citizen> {
  constructor() {
    super(CITIZEN_RESOURCE_PATH, citizenMapper);
  }
}
