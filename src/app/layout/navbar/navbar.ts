import { Component, computed, ElementRef, inject, input, output, viewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Avatar, Dropdown, Icon, ThemeService, Toggle } from '../../components/ui';
import type { DropdownItem } from '../../components/ui';
import { AuthService } from '../../core/auth/auth.service';

/** Top bar: drawer toggle (mobile only) + brand + theme switch + user menu. */
@Component({
  selector: 'app-navbar',
  imports: [RouterLink, Avatar, Dropdown, Icon, Toggle],
  template: `
    <header
      class="inset-shadow-glass-highlight relative z-20 flex items-center gap-3 rounded-2xl border border-glass-border bg-glass-surface px-4 py-3 shadow-md backdrop-blur-glass [border-top-color:var(--color-border-h)] md:px-6"
    >
      <button
        #menuButton
        type="button"
        class="rounded-xl border border-glass-border p-2 text-foreground transition-[background-color,scale] duration-200 hover:bg-surface-muted active:scale-90"
        [attr.aria-expanded]="isSidebarOpen()"
        aria-controls="sidebar-navigation"
        aria-label="Abrir o cerrar el menú de navegación"
        (click)="menuToggled.emit()"
      >
        <svg
          class="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          aria-hidden="true"
        >
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <!-- Brand: solid-3D blue chip. Solid primary-strong (not a light gradient)
           keeps white text at AA (≈5:1); the ::before gloss gives the 3D sheen. -->
      <a
        routerLink="/"
        class="relative inline-flex items-center overflow-hidden rounded-xl bg-primary-strong px-3 py-1.5 font-display text-lg font-semibold text-on-primary shadow-blue [border-bottom:1.5px_solid_rgba(0,0,0,0.22)] [border-top:1.5px_solid_rgba(255,255,255,0.32)] before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-[46%] before:bg-[linear-gradient(180deg,rgba(255,255,255,0.25),transparent)] before:content-['']"
      >
        Territorial
      </a>

      <div class="ms-auto flex items-center gap-3">
        <span class="hidden text-sm text-muted lg:inline">Sistema de Valoración Territorial</span>

        <!-- Theme switch (sun = claro, moon = oscuro). -->
        <ui-toggle
          [checked]="!theme.isDark()"
          iconOn="sun"
          iconOff="moon"
          label="Cambiar tema claro u oscuro"
          (toggled)="theme.toggle()"
        />

        <!-- User menu (CU-07). Trigger shows avatar + name; the panel repeats the
             identity (avatar + name + email) and offers profile / logout. -->
        <ui-dropdown align="end" [items]="userMenu" (selected)="onUserAction($event)">
          <ui-avatar [seed]="user().email" size="sm" />
          <span class="hidden text-sm font-medium text-foreground sm:inline">{{ user().name }}</span>
          <ui-icon name="chevron-down" size="sm" color="muted" />

          <div uiDropdownHeader class="mb-1 flex items-center gap-3 border-b border-glass-border px-3 py-2.5">
            <ui-avatar [seed]="user().email" />
            <div class="min-w-0">
              <p class="truncate text-sm font-semibold text-foreground">{{ user().name }}</p>
              <p class="truncate text-xs text-muted">{{ user().email }}</p>
            </div>
          </div>
        </ui-dropdown>
      </div>
    </header>
  `,
})
export class Navbar {
  readonly isSidebarOpen = input.required<boolean>();
  readonly menuToggled = output<void>();

  protected readonly theme = inject(ThemeService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly menuButton = viewChild.required<ElementRef<HTMLButtonElement>>('menuButton');

  protected readonly user = computed(() => {
    const currentUser = this.auth.currentUser();
    return {
      name: currentUser?.displayName ?? currentUser?.email ?? 'Usuario',
      email: currentUser?.email ?? '',
    };
  });

  protected readonly userMenu: readonly DropdownItem[] = [
    { value: 'profile', label: 'Perfil personal', icon: 'user' },
    { separator: true },
    { value: 'logout', label: 'Cerrar sesión', icon: 'close', danger: true },
  ];

  /** Returns keyboard focus to the toggle when the drawer closes (WCAG 2.4.3). */
  focusMenuButton(): void {
    this.menuButton().nativeElement.focus();
  }

  protected onUserAction(value: string): void {
    if (value === 'logout') {
      void this.auth.signOut().then(() => this.router.navigate(['/login']));
    }
  }
}
