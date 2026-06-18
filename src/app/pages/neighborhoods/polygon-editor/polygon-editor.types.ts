// Working types for the neighborhood polygon EDITOR (CU-09 / CU-10). These are
// feature-internal types — not domain models (those live in models/) and not UI
// Kit unions (those live in components/ui/types.ts). They describe the in-memory
// shape of a polygon while an Official demarcates it, before it is persisted.

/**
 * A single vertex while it is being edited on the map. It is intentionally
 * leaner than the persisted {@link PolygonPoint}: the editor only cares about a
 * stable identity and a position. `point_type`/`order` are derived at save time.
 */
export interface EditableVertex {
  /** Stable client-side id for `@for` tracking and the map feature id. */
  readonly clientId: string;
  /**
   * Backend primary key (`id_point`) when the vertex already exists; `null` for
   * a vertex added in this session that has not been persisted yet.
   */
  readonly idPoint: number | null;
  readonly latitude: number;
  readonly longitude: number;
}

/** Interaction mode. `view` = read-only render; `draw` = add / move / delete vertices. */
export type EditorMode = 'view' | 'draw';

/** A specific reason a ring is not yet a usable polygon. */
export type RingIssue = 'too-few-vertices' | 'duplicate-vertices';

/** Outcome of validating the working ring (spec.md RN-24, RN-26). */
export interface RingValidation {
  /** True only when the ring can be saved as a polygon (no blocking issues). */
  readonly isValid: boolean;
  readonly vertexCount: number;
  /** Empty when valid; otherwise every blocking reason, for messaging. */
  readonly issues: readonly RingIssue[];
}

/** A vertex carrying its computed ring position (1-based), ready to persist. */
export interface OrderedVertex {
  /** `null` for vertices that must be created (POST); set for updates (PUT). */
  readonly idPoint: number | null;
  readonly latitude: number;
  readonly longitude: number;
  /** 1-based position in the ring, derived from the editing order. */
  readonly order: number;
}

/**
 * The create / update / delete sets produced by diffing the edited vertices
 * against the loaded baseline — the heart of the "diff & sync" persistence
 * strategy. The service turns each set into a POST / PUT / DELETE on /api/points.
 */
export interface PolygonPersistenceDiff {
  /** Vertices new in this session → POST. */
  readonly toCreate: readonly OrderedVertex[];
  /** Existing vertices whose position or order changed → PUT. */
  readonly toUpdate: readonly OrderedVertex[];
  /** `id_point` values present in the baseline but removed by the user → DELETE. */
  readonly toDelete: readonly number[];
}
