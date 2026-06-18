/**
 * Authenticated identity as seen by the UI — provided by Firebase OAuth
 * (Google / Microsoft / GitHub, spec.md §4). The role lives in a separate
 * signal on AuthService because it is resolved against the backend.
 */
export interface AuthUser {
  readonly uid: string;
  /** May be null when the OAuth provider hides the email (e.g. GitHub privacy setting). */
  readonly email: string | null;
  readonly displayName: string | null;
  readonly photoUrl: string | null;
}
