/**
 * UI model for a city (camelCase), produced by `cityMapper` from CityDto.
 * Belongs to a department (`idDepartment`). Plain JSON contract — no file.
 */
export interface City {
  readonly id: number;
  /** FK → Department.id. */
  readonly idDepartment: number;
  readonly name: string;
  /** DANE administrative code (5 digits for cities, e.g. "17001"). */
  readonly daneCode: string;
}
