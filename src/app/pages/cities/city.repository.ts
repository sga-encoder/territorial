import { Injectable } from '@angular/core';
import { BaseRepository } from '../../core/http/base-repository';
import { CityDto } from '../../models/city.dto';
import { City } from '../../models/city.model';
import { cityMapper } from './city.mapper';

const CITY_RESOURCE_PATH = 'cities';

/** HTTP access to /api/cities — plain JSON, generic BaseRepository. */
@Injectable({ providedIn: 'root' })
export class CityRepository extends BaseRepository<CityDto, City> {
  constructor() {
    super(CITY_RESOURCE_PATH, cityMapper);
  }
}
