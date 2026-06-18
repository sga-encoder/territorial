import { isPlatformBrowser } from '@angular/common';
import {
  afterRenderEffect,
  Component,
  computed,
  ElementRef,
  inject,
  output,
  PLATFORM_ID,
  viewChild,
} from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';
import type { UserRole } from '../../models/user-role.model';
import type { SidebarEntry } from './sidebar.model';
import { SidebarItem } from './sidebar-item';
import { SidebarService } from './sidebar.service';

// ── Nav definitions per role ────────────────────────────────────────────────

const CITIZEN_NAV: readonly SidebarEntry[] = [
  { kind: 'link', label: 'Mapa de anotaciones', path: '/annotations/map', enabled: true, icon: 'map-pin' },
];

const OFFICIAL_NAV: readonly SidebarEntry[] = [
  { kind: 'link', label: 'Mapa de anotaciones', path: '/annotations/map', enabled: true, icon: 'map-pin' },
  { kind: 'link', label: 'Mapa de seguimiento', path: '/map', enabled: true, icon: 'map-pin' },
  {
    kind: 'group',
    id: 'territory',
    label: 'Territorio',
    icon: 'map-pin',
    children: [
      { label: 'Barrios', path: '/territory/neighborhoods', enabled: true, icon: 'map-pin' },
      { label: 'Demarcación', path: '/territory/demarcation', enabled: true, icon: 'waypoints' },
    ],
  },
];

const ADMIN_NAV: readonly SidebarEntry[] = [
  { kind: 'link', label: 'Nuevos ingresos', path: '/pending-users', enabled: true, icon: 'user' },
  { kind: 'link', label: 'Entidades', path: '/entities', enabled: true, icon: 'info' },
  {
    kind: 'group',
    id: 'people',
    label: 'Personas',
    icon: 'user',
    children: [
      { label: 'Funcionarios', path: '/officials', enabled: true, icon: 'user' },
      { label: 'Ciudadanos', path: '/citizens', enabled: true, icon: 'user' },
    ],
  },
  {
    kind: 'group',
    id: 'territory',
    label: 'Territorio',
    icon: 'map-pin',
    children: [
      { label: 'Departamentos', path: '/territory/departments', enabled: true, icon: 'map-pin' },
      { label: 'Ciudades', path: '/territory/cities', enabled: true, icon: 'map-pin' },
      { label: 'Comunas', path: '/territory/communes', enabled: true, icon: 'map-pin' },
      { label: 'Barrios', path: '/territory/neighborhoods', enabled: true, icon: 'map-pin' },
      { label: 'Demarcación', path: '/territory/demarcation', enabled: true, icon: 'waypoints' },
    ],
  },
  { kind: 'link', label: 'Mapa de seguimiento', path: '/map', enabled: true, icon: 'map-pin' },
  { kind: 'link', label: 'Categorías', path: '/categories', enabled: true, icon: 'search' },
  {
    kind: 'group',
    id: 'annotations',
    label: 'Anotaciones',
    icon: 'info',
    children: [
      { label: 'Anotaciones', path: '/annotations', enabled: true, icon: 'info' },
      { label: 'Mapa de anotaciones', path: '/annotations/map', enabled: true, icon: 'map-pin' },
      { label: 'Categorías de anotación', path: '/annotation-categories', enabled: true, icon: 'search' },
      { label: 'Evidencias', path: '/evidences', enabled: true, icon: 'info' },
    ],
  },
  {
    kind: 'group',
    id: 'reports',
    label: 'Reportes',
    icon: 'bar-chart-2',
    children: [
      { label: 'Consulta visual', path: '/reports', enabled: true, icon: 'bar-chart' },
      { label: 'Chat IA', path: '/reports/chat', enabled: true, icon: 'message-square' },
    ],
  },
];

const NAV_BY_ROLE: Record<UserRole, readonly SidebarEntry[]> = {
  citizen: CITIZEN_NAV,
  official: OFFICIAL_NAV,
  admin: ADMIN_NAV,
};

/**
 * Main navigation. Off-canvas drawer on mobile (state shared via SidebarService),
 * static column from the `md` breakpoint up. Nav items are filtered by the
 * authenticated user's role (spec.md §4).
 */
@Component({
  selector: 'app-sidebar',
  imports: [SidebarItem],
  templateUrl: './sidebar.html',
  host: { '(document:keydown.escape)': 'onEscapePressed()' },
})
export class Sidebar {
  protected readonly sidebar = inject(SidebarService);
  private readonly auth = inject(AuthService);

  readonly closed = output<void>();

  protected readonly navItems = computed<readonly SidebarEntry[]>(() => {
    const role = this.auth.role();
    return role !== null ? (NAV_BY_ROLE[role] ?? []) : [];
  });

  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly navigationElement = viewChild.required<ElementRef<HTMLElement>>('navigation');

  constructor() {
    afterRenderEffect(() => {
      if (this.sidebar.expanded() && this.isMobileViewport()) {
        this.navigationElement().nativeElement.focus();
      }
    });
  }

  protected onEscapePressed(): void {
    if (this.sidebar.expanded() && this.isMobileViewport()) {
      this.closed.emit();
    }
  }

  protected onNavLinkClicked(): void {
    if (this.isMobileViewport()) {
      this.closed.emit();
    }
  }

  protected onBackdropClicked(): void {
    this.closed.emit();
  }

  private isMobileViewport(): boolean {
    return this.isBrowser && window.matchMedia('(max-width: 767px)').matches;
  }
}
