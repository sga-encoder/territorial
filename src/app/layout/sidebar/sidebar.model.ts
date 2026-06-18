import type { IconName } from '../../components/ui';

/** A leaf navigation entry (routable link). */
export interface SidebarLink {
  readonly label: string;
  readonly path: string;
  /** Disabled entries render as "Próximamente" until their feature module exists. */
  readonly enabled: boolean;
  readonly icon: IconName;
}

/** A collapsible group of links (subcategories), shown as a dropdown. */
export interface SidebarGroup {
  readonly id: string;
  readonly label: string;
  readonly icon: IconName;
  readonly children: readonly SidebarLink[];
}

/** Discriminated union: SidebarItem decides link vs group from `kind`. */
export type SidebarEntry =
  | ({ readonly kind: 'link' } & SidebarLink)
  | ({ readonly kind: 'group' } & SidebarGroup);
