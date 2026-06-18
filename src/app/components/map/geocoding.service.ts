import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';

/** A place matched from an address search (already in UI shape). */
export interface GeocodeResult {
  /** Human-readable address (e.g. "Comuna 8, Manizales, Caldas, Colombia"). */
  readonly label: string;
  readonly latitude: number;
  readonly longitude: number;
}

/** Raw Nominatim row — never leaves this service. */
interface NominatimResult {
  readonly display_name: string;
  readonly lat: string;
  readonly lon: string;
}

const NOMINATIM_SEARCH_URL = 'https://nominatim.openstreetmap.org/search';
/** Bias results to Colombia (the product domain) and cap the list. */
const COUNTRY_CODES = 'co';
const RESULT_LIMIT = 5;

/**
 * Forward geocoding (address → coordinates) for the map point picker, backed by
 * OpenStreetMap Nominatim (free, no API key, CORS-enabled). The Firebase
 * interceptor only touches backend URLs, so no token leaks to this third party.
 *
 * TODO(prod): Nominatim's usage policy asks for an identifying User-Agent and
 * ≤1 req/s. A browser cannot set User-Agent; for production proxy this through
 * the backend (or a self-hosted instance) and debounce the input.
 */
@Injectable({ providedIn: 'root' })
export class GeocodingService {
  private readonly httpClient = inject(HttpClient);

  /** Returns up to 5 matches for the query, or an empty list on error/blank. */
  search(query: string): Observable<readonly GeocodeResult[]> {
    const trimmed = query.trim();
    if (trimmed === '') {
      return of([]);
    }
    const params = new HttpParams()
      .set('q', trimmed)
      .set('format', 'json')
      .set('addressdetails', '0')
      .set('limit', String(RESULT_LIMIT))
      .set('countrycodes', COUNTRY_CODES);

    return this.httpClient.get<NominatimResult[]>(NOMINATIM_SEARCH_URL, { params }).pipe(
      map((results) =>
        results.map((result) => ({
          label: result.display_name,
          latitude: Number(result.lat),
          longitude: Number(result.lon),
        })),
      ),
      catchError(() => of([])),
    );
  }
}
