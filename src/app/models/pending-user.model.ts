/** A Firebase user who signed in but has no role in the backend yet.
 *  Stored in Firestore `pending_users/{uid}` until the admin classifies them. */
export interface PendingUser {
  readonly uid: string;
  readonly email: string;
  readonly displayName: string | null;
  readonly photoUrl: string | null;
  /** ISO-8601 string from the Firestore server timestamp. */
  readonly registeredAt: string;
}
