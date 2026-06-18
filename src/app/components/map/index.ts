// Shared map widgets/helpers. Heavy (MapLibre) — import points are lazy-loaded
// (route-level or via @defer) so non-map pages never bundle the engine.
export { GeocodingService } from './geocoding.service';
export type { GeocodeResult } from './geocoding.service';
export { MapPointPicker } from './map-point-picker';
export {
  applyBaseMapTheme,
  createBaseMapStyle,
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  readCssVar,
} from './map-style';
