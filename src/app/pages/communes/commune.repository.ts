import { Injectable } from '@angular/core';
import { BaseRepository } from '../../core/http/base-repository';
import { CommuneDto } from '../../models/commune.dto';
import { Commune } from '../../models/commune.model';
import { communeMapper } from './commune.mapper';

const COMMUNE_RESOURCE_PATH = 'communes';

/** HTTP access to /api/communes — plain JSON, generic BaseRepository. */
@Injectable({ providedIn: 'root' })
export class CommuneRepository extends BaseRepository<CommuneDto, Commune> {
  constructor() {
    super(COMMUNE_RESOURCE_PATH, communeMapper);
  }
}
