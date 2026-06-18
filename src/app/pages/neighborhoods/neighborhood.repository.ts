import { Injectable } from '@angular/core';
import { BaseRepository } from '../../core/http/base-repository';
import { NeighborhoodDto } from '../../models/neighborhood.dto';
import { Neighborhood } from '../../models/neighborhood.model';
import { neighborhoodMapper } from './neighborhood.mapper';

const NEIGHBORHOOD_RESOURCE_PATH = 'neighborhoods';

/** HTTP access to /api/neighborhoods — plain JSON, generic BaseRepository. */
@Injectable({ providedIn: 'root' })
export class NeighborhoodRepository extends BaseRepository<NeighborhoodDto, Neighborhood> {
  constructor() {
    super(NEIGHBORHOOD_RESOURCE_PATH, neighborhoodMapper);
  }
}
