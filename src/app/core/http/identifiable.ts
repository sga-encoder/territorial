/** Every backend resource is addressed by a numeric id (spec.md §3). */
export interface Identifiable {
  readonly id: number;
}
