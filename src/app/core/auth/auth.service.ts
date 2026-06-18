import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import type { Auth, AuthProvider, User } from 'firebase/auth';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthUser } from '../../models/auth-user.model';
import { CitizenDto } from '../../models/citizen.dto';
import { OfficialDto } from '../../models/official.dto';
import { UserRole } from '../../models/user-role.model';
import { API_PREFIX } from '../http/base-repository';
import { StorageService } from '../storage/storage.service';
import { PendingUserService } from '../../pages/pending-users/pending-user.service';

const MICROSOFT_PROVIDER_ID = 'microsoft.com';
const ADMIN_ROLE_NAME = 'admin';
const TOKEN_COOKIE = 'territorial_token';
/** Firebase ID tokens expire after 1 h; keep the cookie slightly longer so the
 *  interceptor can still read it during the auto-refresh window. */
const TOKEN_COOKIE_EXPIRY_DAYS = 1;

/**
 * Firebase Auth: Google / Microsoft / GitHub OAuth + Email+Password.
 * Role is resolved by querying the backend after every successful sign-in.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly httpClient = inject(HttpClient);
  private readonly storage = inject(StorageService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private firebaseAuth: Auth | null = null;
  private resolveAuthReady!: () => void;
  private readonly authReady = new Promise<void>((resolve) => (this.resolveAuthReady = resolve));

  private readonly pendingUserService = inject(PendingUserService);

  private readonly currentUserSignal = signal<AuthUser | null>(null);
  private readonly roleSignal = signal<UserRole | null>(null);
  private readonly idTokenSignal = signal<string | null>(null);
  private readonly officialEntityIdSignal = signal<number | null>(null);

  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly role = this.roleSignal.asReadonly();
  readonly isLoggedIn = computed(() => this.currentUser() !== null);
  readonly idToken = this.idTokenSignal.asReadonly();
  /** Entity ID of the currently logged-in official (null when not an official). */
  readonly officialEntityId = this.officialEntityIdSignal.asReadonly();

  constructor() {
    if (!this.isBrowser) {
      this.resolveAuthReady();
      return;
    }
    void this.initializeFirebaseAuth();
  }

  whenReady(): Promise<void> {
    return this.authReady;
  }

  async signInWithGoogle(): Promise<void> {
    const { GoogleAuthProvider } = await import('firebase/auth');
    await this.signInWithProvider(new GoogleAuthProvider());
  }

  async signInWithMicrosoft(): Promise<void> {
    const { OAuthProvider } = await import('firebase/auth');
    await this.signInWithProvider(new OAuthProvider(MICROSOFT_PROVIDER_ID));
  }

  async signInWithGitHub(): Promise<void> {
    const { GithubAuthProvider } = await import('firebase/auth');
    await this.signInWithProvider(new GithubAuthProvider());
  }

  async signInWithEmail(email: string, password: string): Promise<void> {
    await this.authReady;
    if (this.firebaseAuth === null) throw new Error('Firebase Auth only available in browser.');
    const { signInWithEmailAndPassword } = await import('firebase/auth');
    // signInWithEmailAndPassword returns UserCredential synchronously after Firebase
    // confirms the credentials — call handleAuthStateChange directly so the role
    // is fully resolved before this method returns (avoids the race in login page).
    const { user } = await signInWithEmailAndPassword(this.firebaseAuth, email, password);
    await this.handleAuthStateChange(user);
  }

  async signOut(): Promise<void> {
    if (this.firebaseAuth === null) return;
    const { signOut: firebaseSignOut } = await import('firebase/auth');
    await firebaseSignOut(this.firebaseAuth);
  }

  private async initializeFirebaseAuth(): Promise<void> {
    const { initializeApp } = await import('firebase/app');
    const { getAuth, onIdTokenChanged } = await import('firebase/auth');
    this.firebaseAuth = getAuth(initializeApp(environment.firebase));
    onIdTokenChanged(this.firebaseAuth, (user) => void this.handleAuthStateChange(user));
  }

  private async signInWithProvider(provider: AuthProvider): Promise<void> {
    await this.authReady;
    if (this.firebaseAuth === null) throw new Error('Firebase Auth only available in browser.');
    const { signInWithPopup } = await import('firebase/auth');
    const { user } = await signInWithPopup(this.firebaseAuth, provider);
    await this.handleAuthStateChange(user);
  }

  private async handleAuthStateChange(firebaseUser: User | null): Promise<void> {
    if (firebaseUser === null) {
      this.currentUserSignal.set(null);
      this.roleSignal.set(null);
      this.idTokenSignal.set(null);
      this.officialEntityIdSignal.set(null);
      this.storage.removeCookie(TOKEN_COOKIE);
      this.resolveAuthReady();
      return;
    }
    const token = await firebaseUser.getIdToken();
    this.idTokenSignal.set(token);
    this.storage.setCookie(TOKEN_COOKIE, token, { expiryDays: TOKEN_COOKIE_EXPIRY_DAYS });
    this.currentUserSignal.set({
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName,
      photoUrl: firebaseUser.photoURL,
    });
    const role =
      firebaseUser.email === null ? null : await this.resolveRole(firebaseUser.email);
    this.roleSignal.set(role);
    if (role === null && firebaseUser.email !== null) {
      this.pendingUserService.register(
        firebaseUser.uid,
        firebaseUser.email,
        firebaseUser.displayName,
        firebaseUser.photoURL,
      );
    }
    this.resolveAuthReady();
  }

  private async resolveRole(email: string): Promise<UserRole | null> {
    const officialRole = await this.findOfficialRole(email);
    if (officialRole !== null) return officialRole;
    return this.findCitizenRole(email);
  }

  private async findOfficialRole(email: string): Promise<UserRole | null> {
    const officials = await this.searchByEmail<OfficialDto>('officials', email);
    const official = officials.find((o) => o.email === email);
    if (official === undefined) return null;
    this.officialEntityIdSignal.set(official.id_entity);
    return official.role === ADMIN_ROLE_NAME ? 'admin' : 'official';
  }

  private async findCitizenRole(email: string): Promise<UserRole | null> {
    const citizens = await this.searchByEmail<CitizenDto>('citizens', email);
    return citizens.some((c) => c.email === email) ? 'citizen' : null;
  }

  private async searchByEmail<TDto>(resourcePath: string, email: string): Promise<TDto[]> {
    try {
      return await firstValueFrom(
        this.httpClient.get<TDto[]>(`${environment.baseUrl}${API_PREFIX}/${resourcePath}/search`, {
          params: { email },
        }),
      );
    } catch {
      return [];
    }
  }
}
