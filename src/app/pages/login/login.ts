import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { Card, Container, InputText, Text, Title } from '../../components/ui';
import { ParticlesBackground } from '../../components/visual';

type Provider = 'google' | 'microsoft' | 'github';

const ROLE_HOME: Record<string, string> = {
  admin: '/entities',
  official: '/annotations',
  citizen: '/annotations',
};

/**
 * Public login page (outside the authenticated shell). Offers three Firebase
 * OAuth providers plus a native email/password form backed by Flask JWT,
 * so the app works independently of Firebase Auth.
 */
@Component({
  selector: 'app-login',
  imports: [Card, Container, InputText, Text, Title, ParticlesBackground, FormsModule],
  template: `
    <div class="relative flex h-dvh w-screen items-center justify-center overflow-hidden bg-background">
      <ui-particles-background density="dense" speed="calm" pointerEffect="repel" />

      <div class="relative z-10 w-full max-w-sm px-4">
        <ui-card>
          <ui-container direction="column" [gap]="6">

            <!-- Brand header -->
            <ui-container direction="column" align="center" [gap]="2">
              <span
                class="relative inline-flex items-center overflow-hidden rounded-2xl bg-primary-strong px-5 py-2 font-display text-2xl font-semibold text-on-primary shadow-blue [border-bottom:1.5px_solid_rgba(0,0,0,0.22)] [border-top:1.5px_solid_rgba(255,255,255,0.32)] before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-[46%] before:bg-[linear-gradient(180deg,rgba(255,255,255,0.25),transparent)] before:content-['']"
              >
                Territorial
              </span>
              <ui-title [level]="4">Sistema de Valoración Territorial</ui-title>
              <ui-text variant="caption" color="muted">
                Inicia sesión para continuar
              </ui-text>
            </ui-container>

            <!-- Error -->
            @if (error()) {
              <div class="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3">
                <ui-text color="danger" variant="caption">{{ error() }}</ui-text>
              </div>
            }

            <!-- Native email/password form -->
            <form (ngSubmit)="signInWithEmail()" #emailForm="ngForm">
              <ui-container direction="column" [gap]="3">
                <ui-input
                  label="Correo electrónico"
                  type="email"
                  placeholder="correo@ejemplo.com"
                  name="emailField"
                  [(ngModel)]="emailValue"
                  [disabled]="loading()"
                  required
                />
                <ui-input
                  label="Contraseña"
                  type="password"
                  placeholder="••••••••"
                  name="passwordField"
                  [(ngModel)]="passwordValue"
                  [disabled]="loading()"
                  required
                />
                <button
                  type="submit"
                  [disabled]="loading() || !emailForm.valid"
                  class="inset-shadow-highlight flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-primary/40 bg-primary px-4 py-3 text-sm font-semibold text-on-primary transition-[background-color,opacity,scale] duration-200 hover:bg-primary-strong active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  @if (loading() && activeProvider() === 'email') {
                    <span class="h-4 w-4 animate-spin rounded-full border-2 border-on-primary/40 border-t-on-primary"></span>
                    <span>Entrando…</span>
                  } @else {
                    Entrar
                  }
                </button>
              </ui-container>
            </form>

            <!-- Divider -->
            <div class="flex items-center gap-3">
              <hr class="flex-1 border-glass-border" />
              <ui-text variant="caption" color="muted">o continúa con</ui-text>
              <hr class="flex-1 border-glass-border" />
            </div>

            <!-- OAuth buttons -->
            <ui-container direction="column" [gap]="3">
              <button
                type="button"
                [disabled]="loading()"
                [class]="providerButtonClass(loading() && activeProvider() === 'google')"
                (click)="signIn('google')"
              >
                <svg class="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span class="flex-1">
                  {{ loading() && activeProvider() === 'google' ? 'Conectando…' : 'Google' }}
                </span>
                @if (loading() && activeProvider() === 'google') {
                  <span class="h-4 w-4 animate-spin rounded-full border-2 border-foreground/30 border-t-foreground"></span>
                }
              </button>

              <button
                type="button"
                [disabled]="loading()"
                [class]="providerButtonClass(loading() && activeProvider() === 'microsoft')"
                (click)="signIn('microsoft')"
              >
                <svg class="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <rect x="1" y="1" width="10" height="10" fill="#F25022"/>
                  <rect x="13" y="1" width="10" height="10" fill="#7FBA00"/>
                  <rect x="1" y="13" width="10" height="10" fill="#00A4EF"/>
                  <rect x="13" y="13" width="10" height="10" fill="#FFB900"/>
                </svg>
                <span class="flex-1">
                  {{ loading() && activeProvider() === 'microsoft' ? 'Conectando…' : 'Microsoft' }}
                </span>
                @if (loading() && activeProvider() === 'microsoft') {
                  <span class="h-4 w-4 animate-spin rounded-full border-2 border-foreground/30 border-t-foreground"></span>
                }
              </button>

              <button
                type="button"
                [disabled]="loading()"
                [class]="providerButtonClass(loading() && activeProvider() === 'github')"
                (click)="signIn('github')"
              >
                <svg class="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                </svg>
                <span class="flex-1">
                  {{ loading() && activeProvider() === 'github' ? 'Conectando…' : 'GitHub' }}
                </span>
                @if (loading() && activeProvider() === 'github') {
                  <span class="h-4 w-4 animate-spin rounded-full border-2 border-foreground/30 border-t-foreground"></span>
                }
              </button>
            </ui-container>

            <ui-text variant="caption" color="muted" class="text-center">
              Solo usuarios registrados en el sistema pueden acceder.
            </ui-text>

          </ui-container>
        </ui-card>
      </div>
    </div>
  `,
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly loading = signal(false);
  protected readonly activeProvider = signal<Provider | 'email' | null>(null);
  protected readonly error = signal<string | null>(null);

  protected emailValue = '';
  protected passwordValue = '';

  protected providerButtonClass(isActive: boolean): string {
    const base =
      'inset-shadow-highlight flex w-full cursor-pointer items-center gap-3 rounded-xl border border-glass-border ' +
      'bg-surface px-4 py-3 text-sm font-medium text-foreground transition-[background-color,opacity,scale] ' +
      'duration-200 hover:bg-surface-muted active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50';
    return isActive ? `${base} opacity-70` : base;
  }

  protected async signInWithEmail(): Promise<void> {
    this.error.set(null);
    this.loading.set(true);
    this.activeProvider.set('email');
    try {
      await this.auth.signInWithEmail(this.emailValue.trim(), this.passwordValue);
      await this.redirectAfterLogin();
    } catch (err: unknown) {
      this.error.set(this.extractErrorMessage(err));
    } finally {
      this.loading.set(false);
      this.activeProvider.set(null);
    }
  }

  protected async signIn(provider: Provider): Promise<void> {
    this.error.set(null);
    this.loading.set(true);
    this.activeProvider.set(provider);
    try {
      if (provider === 'google') await this.auth.signInWithGoogle();
      else if (provider === 'microsoft') await this.auth.signInWithMicrosoft();
      else await this.auth.signInWithGitHub();

      await this.auth.whenReady();
      const role = this.auth.role();
      if (role === null) {
        this.error.set('Tu cuenta no está registrada en el sistema. Contacta al administrador.');
        await this.auth.signOut();
        return;
      }
      await this.router.navigateByUrl(ROLE_HOME[role] ?? '/');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '';
      if (!message.includes('popup-closed')) {
        this.error.set('No fue posible iniciar sesión. Intenta de nuevo.');
      }
    } finally {
      this.loading.set(false);
      this.activeProvider.set(null);
    }
  }

  private async redirectAfterLogin(): Promise<void> {
    const role = this.auth.role();
    if (role === null) {
      this.error.set('Tu cuenta no está registrada en el sistema. Contacta al administrador.');
      await this.auth.signOut();
      return;
    }
    await this.router.navigateByUrl(ROLE_HOME[role] ?? '/');
  }

  private extractErrorMessage(err: unknown): string {
    const code = (err as { code?: string })?.code ?? '';
    if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
      return 'Correo o contraseña incorrectos.';
    }
    if (code === 'auth/too-many-requests') return 'Demasiados intentos fallidos. Intenta más tarde.';
    if (code === 'auth/user-disabled') return 'Esta cuenta ha sido deshabilitada.';
    if (code === 'auth/invalid-email') return 'El formato del correo no es válido.';
    if (code === 'auth/operation-not-allowed') return 'El inicio de sesión con correo no está habilitado. Contacta al administrador.';
    return 'No fue posible iniciar sesión. Intenta de nuevo.';
  }
}
