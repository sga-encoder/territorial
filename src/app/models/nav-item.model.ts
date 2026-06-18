/** Entry of the main sidebar navigation. */
export interface NavItem {
  readonly label: string;
  readonly path: string;
  /** Disabled entries render as "Próximamente" until their feature module exists. */
  readonly enabled: boolean;
}
