import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { io, type Socket } from 'socket.io-client';
import type { Official } from '../../models/official.model';
import { OfficialRepository } from '../officials/official.repository';
import { environment } from '../../../environments/environment';

export type OfficialConnectionState = 'online' | 'stale' | 'offline';

export interface TrackedOfficial {
  readonly official: Official;
  readonly state: OfficialConnectionState;
  /** Live lat from Socket.IO, falls back to official.lastLatitude. */
  readonly latitude: number;
  /** Live lng from Socket.IO, falls back to official.lastLongitude. */
  readonly longitude: number;
  readonly lastUpdate: string | null;
}

interface TrackingEventPayload {
  officials: Array<{
    id_official: number;
    latitude: number;
    longitude: number;
    last_gps_update: string;
  }>;
}

interface LiveFix {
  latitude: number;
  longitude: number;
  lastGpsUpdate: string;
}

/**
 * Autonomous live-tracking service for the map page. On start() it:
 *   1. Loads the full official roster via REST.
 *   2. POSTs /tracking/start for every official with gpsActive + active status
 *      — no manual action from the officials list needed.
 *   3. Opens the Socket.IO connection and listens for `official_tracking` events.
 * On stop() it POSTs /tracking/stop and disconnects the socket.
 */
@Injectable({ providedIn: 'root' })
export class TrackingMapService {
  private readonly repository = inject(OfficialRepository);

  private readonly allSignal = signal<Official[]>([]);
  private readonly loadingSignal = signal(false);
  /** Positions accumulated across Socket.IO events. */
  private readonly liveFixesSignal = signal<ReadonlyMap<number, LiveFix>>(new Map());
  /** IDs present in the most recent event — determines 'online' state. */
  private readonly onlineIdsSignal = signal<ReadonlySet<number>>(new Set());

  private socket: Socket | null = null;

  readonly isLoading = this.loadingSignal.asReadonly();

  /** Officials that can be placed on the map (have a known or live position). */
  readonly tracked = computed<readonly TrackedOfficial[]>(() => {
    const live = this.liveFixesSignal();
    const online = this.onlineIdsSignal();

    return this.allSignal()
      .filter((o) => live.has(o.id) || (o.lastLatitude !== null && o.lastLongitude !== null))
      .map((o) => {
        const fix = live.get(o.id);
        return {
          official: o,
          state: this.resolveState(o, online.has(o.id)),
          latitude: fix?.latitude ?? o.lastLatitude!,
          longitude: fix?.longitude ?? o.lastLongitude!,
          lastUpdate: fix?.lastGpsUpdate ?? o.lastGpsUpdate,
        };
      });
  });

  constructor() {
    // Page calls stop() explicitly on destroy; DestroyRef is a safety net for
    // service teardown in case the page skips it (e.g. during testing).
    inject(DestroyRef).onDestroy(() => {
      if (this.socket !== null) void this.stop();
    });
  }

  /** Loads officials, starts the backend tracking session, and opens the socket. */
  async start(): Promise<void> {
    this.loadingSignal.set(true);
    try {
      const officials = await firstValueFrom(this.repository.listAll());
      this.allSignal.set(officials);

      const trackableIds = officials
        .filter((o) => o.gpsActive && o.status === 'active')
        .map((o) => o.id);

      if (trackableIds.length > 0) {
        await firstValueFrom(this.repository.startTracking(trackableIds));
      }

      this.connectSocket();
    } finally {
      this.loadingSignal.set(false);
    }
  }

  /** Stops the backend tracking session and disconnects the socket. */
  async stop(): Promise<void> {
    try {
      await firstValueFrom(this.repository.stopTracking());
    } catch {
      // Best-effort: the page is being destroyed, ignore network errors.
    } finally {
      this.socket?.disconnect();
      this.socket = null;
    }
  }

  private connectSocket(): void {
    if (this.socket !== null) return;

    this.socket = io(environment.baseUrl, { transports: ['websocket', 'polling'] });

    this.socket.on('official_tracking', (payload: TrackingEventPayload) => {
      const incoming = payload.officials;

      this.liveFixesSignal.update((prev) => {
        const next = new Map(prev);
        for (const item of incoming) {
          next.set(item.id_official, {
            latitude: item.latitude,
            longitude: item.longitude,
            lastGpsUpdate: item.last_gps_update,
          });
        }
        return next;
      });

      this.onlineIdsSignal.set(new Set(incoming.map((item) => item.id_official)));
    });
  }

  private resolveState(official: Official, isOnline: boolean): OfficialConnectionState {
    if (!official.gpsActive) return 'offline';
    return isOnline ? 'online' : 'stale';
  }
}
