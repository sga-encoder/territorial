import { Component, inject, viewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ModalOutlet, ToastOutlet } from '../../components/ui';
import { Navbar } from '../navbar/navbar';
import { Sidebar } from '../sidebar/sidebar';
import { SidebarService } from '../sidebar/sidebar.service';
import { GlassStage, ParticlesBackground } from '../../components/visual';

/** Application frame: skip link + sidebar + navbar + routed content area. */
@Component({
  selector: 'app-shell',
  imports: [ModalOutlet, RouterOutlet, Navbar, Sidebar, ToastOutlet, ParticlesBackground, GlassStage],
  template: `
    <a
      href="#main-content"
      class="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary-strong focus:px-4 focus:py-2 focus:text-on-primary"
    >
      Saltar al contenido principal
    </a>
    <div class="relative h-dvh w-screen bg-background text-foreground overflow-hidden">
      <!-- Decorative background particles covering the full viewport -->
      <!-- Particles background: self-positions with fixed inset-0, always fills viewport -->
      <ui-particles-background density="dense" speed="calm" pointerEffect="repel" />
      
      <div class="relative z-20 flex h-full w-full overflow-hidden">
        <app-sidebar (closed)="closeSidebar()" />
        
        <!-- Frame: gap uniforme con los bordes (py/pr) + hueco dinámico para el
             sidebar (pl). Sigue a sidebarVisualExpanded (estado + preview de
             hover), así navbar y contenido se contraen/rebotan en sincronía con
             el ancho del sidebar — al hacer toggle y al expandir por hover. -->
        <div
          class="flex min-w-0 flex-1 flex-col h-full gap-3 overflow-hidden py-3 pl-3 pr-3 transition-[padding] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
          [class.md:pl-70]="sidebarVisualExpanded()"
          [class.md:pl-22]="!sidebarVisualExpanded()"
        >
          <app-navbar [isSidebarOpen]="isSidebarOpen()" (menuToggled)="toggleSidebar()" />

          <main
            id="main-content"
            tabindex="-1"
            class="min-h-0 flex-1 overflow-hidden rounded-2xl"
          >
            <!-- Glass content stage: floats over the particle field (z-20 over z-10),
                 keeps every routed page sharp and legible while the dust is felt
                 blurred through it. Scroll lives inside the glass; main only clips. -->
            <ui-glass-stage class="block h-full overflow-y-auto">
              <router-outlet />
            </ui-glass-stage>
          </main>
        </div>
      </div>
    </div>
    <!-- UI Kit overlays (Capa 5): mounted once for the whole app. -->
    <ui-modal-outlet />
    <ui-toast-outlet />
  `,
})
export class Shell {
  private readonly navbar = viewChild.required(Navbar);
  private readonly sidebarService = inject(SidebarService);

  /** Persisted expanded/collapsed state (drives the navbar toggle's aria state). */
  protected readonly isSidebarOpen = this.sidebarService.expanded;
  /** Visual width incl. hover preview; the navbar + content follow this to contract. */
  protected readonly sidebarVisualExpanded = this.sidebarService.visualExpanded;

  protected toggleSidebar(): void {
    this.sidebarService.toggle();
  }

  protected closeSidebar(): void {
    this.sidebarService.setExpanded(false);
    this.navbar().focusMenuButton();
  }
}
