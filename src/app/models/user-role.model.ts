/**
 * Application roles — the three actors of the platform (spec.md §1).
 * The role is resolved by the system against the backend, never chosen
 * by the user (RN-22).
 */
export type UserRole = 'admin' | 'official' | 'citizen';
