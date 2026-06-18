import { computed, Injectable, signal } from '@angular/core';
import type { NeighborhoodPolygon } from '../../../models/neighborhood-polygon';
import type { PolygonPoint } from '../../../models/polygon-point';
import type { Neighborhood } from '../../../models/neighborhood.model';
import { diffPolygonPoints, toEditableVertices, validateRing } from './polygon-geometry';
import type { EditableVertex, EditorMode } from './polygon-editor.types';

/** Cap on the undo history so a long session cannot grow memory unbounded. */
const MAX_HISTORY = 50;

/**
 * In-session state of the polygon being edited (signals only). It owns the
 * working vertices, the loaded baseline (for dirty/diff), the interaction mode,
 * the selected vertex and an undo history. It performs NO I/O: loading comes
 * from {@link NeighborhoodPolygonService} and saving goes back through it — this
 * service is the single source of truth the map renders from and the toolbar
 * drives, keeping map interaction, persistence and state cleanly separated.
 *
 * Provided at the editor page level (not `root`): a fresh editing session per
 * navigation, shared with the child map via Angular's DI hierarchy.
 */
@Injectable()
export class PolygonEditorState {
  private readonly polygonSignal = signal<NeighborhoodPolygon | null>(null);
  private readonly neighborhoodSignal = signal<Neighborhood | null>(null);
  private readonly verticesSignal = signal<readonly EditableVertex[]>([]);
  private readonly modeSignal = signal<EditorMode>('view');
  private readonly selectedSignal = signal<string | null>(null);
  private readonly historySignal = signal<readonly (readonly EditableVertex[])[]>([]);

  /** Monotonic counter for client ids of vertices created in this session. */
  private nextClientSeq = 0;

  /** The neighborhood being demarcated (name/id for the header and save). */
  readonly neighborhood = this.neighborhoodSignal.asReadonly();
  /** Working vertices, in ring order — what the map renders. */
  readonly vertices = this.verticesSignal.asReadonly();
  /** The persisted points the session started from — the diff baseline. */
  readonly baseline = computed<readonly PolygonPoint[]>(() => this.polygonSignal()?.points ?? []);
  readonly mode = this.modeSignal.asReadonly();
  readonly selectedClientId = this.selectedSignal.asReadonly();
  readonly isEditing = computed(() => this.modeSignal() === 'draw');
  readonly canUndo = computed(() => this.historySignal().length > 0);
  readonly vertexCount = computed(() => this.verticesSignal().length);

  /** Live ring validation (≥3 distinct vertices) — drives save availability. */
  readonly validation = computed(() => validateRing(this.verticesSignal()));

  /** True when the working ring differs from the baseline (anything to persist). */
  readonly isDirty = computed(() => {
    const diff = diffPolygonPoints(this.baseline(), this.verticesSignal());
    return diff.toCreate.length > 0 || diff.toUpdate.length > 0 || diff.toDelete.length > 0;
  });

  /** Seeds the session from a freshly loaded polygon. Resets edits/history. */
  loadFrom(polygon: NeighborhoodPolygon, neighborhood: Neighborhood): void {
    this.polygonSignal.set(polygon);
    this.neighborhoodSignal.set(neighborhood);
    this.verticesSignal.set(toEditableVertices(polygon));
    this.historySignal.set([]);
    this.selectedSignal.set(null);
    this.modeSignal.set('view');
  }

  setMode(mode: EditorMode): void {
    this.modeSignal.set(mode);
    if (mode === 'view') {
      this.selectedSignal.set(null);
    }
  }

  toggleMode(): void {
    this.setMode(this.isEditing() ? 'view' : 'draw');
  }

  select(clientId: string | null): void {
    this.selectedSignal.set(clientId);
  }

  /** Appends a vertex at `[lng, lat]` and selects it (click-to-add). */
  addVertex(longitude: number, latitude: number): void {
    this.pushHistory();
    const vertex: EditableVertex = {
      clientId: `new-${this.nextClientSeq++}`,
      idPoint: null,
      latitude,
      longitude,
    };
    this.verticesSignal.update((list) => [...list, vertex]);
    this.selectedSignal.set(vertex.clientId);
  }

  /** Snapshots state once at the start of a drag, before live `moveVertex` calls. */
  beginInteraction(): void {
    this.pushHistory();
  }

  /** Live update of a vertex position during a drag (no history — see beginInteraction). */
  moveVertex(clientId: string, longitude: number, latitude: number): void {
    this.verticesSignal.update((list) =>
      list.map((vertex) =>
        vertex.clientId === clientId ? { ...vertex, latitude, longitude } : vertex,
      ),
    );
  }

  removeVertex(clientId: string): void {
    this.pushHistory();
    this.verticesSignal.update((list) => list.filter((vertex) => vertex.clientId !== clientId));
    if (this.selectedSignal() === clientId) {
      this.selectedSignal.set(null);
    }
  }

  /** Deletes the currently selected vertex, if any (toolbar/keyboard affordance). */
  removeSelected(): void {
    const selected = this.selectedSignal();
    if (selected !== null) {
      this.removeVertex(selected);
    }
  }

  /** Swaps a vertex with its neighbour, changing its ring position (`order`). */
  reorderVertex(clientId: string, direction: -1 | 1): void {
    const list = this.verticesSignal();
    const index = list.findIndex((vertex) => vertex.clientId === clientId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= list.length) {
      return;
    }
    this.pushHistory();
    const next = [...list];
    [next[index], next[target]] = [next[target], next[index]];
    this.verticesSignal.set(next);
  }

  clearAll(): void {
    this.pushHistory();
    this.verticesSignal.set([]);
    this.selectedSignal.set(null);
  }

  /** Discards every edit, restoring the loaded baseline. */
  reset(): void {
    const polygon = this.polygonSignal();
    this.verticesSignal.set(polygon !== null ? toEditableVertices(polygon) : []);
    this.historySignal.set([]);
    this.selectedSignal.set(null);
  }

  undo(): void {
    const history = this.historySignal();
    if (history.length === 0) {
      return;
    }
    const previous = history[history.length - 1];
    this.historySignal.set(history.slice(0, -1));
    this.verticesSignal.set(previous);
    const selected = this.selectedSignal();
    if (selected !== null && !previous.some((vertex) => vertex.clientId === selected)) {
      this.selectedSignal.set(null);
    }
  }

  private pushHistory(): void {
    this.historySignal.update((history) => [
      ...history.slice(-(MAX_HISTORY - 1)),
      this.verticesSignal(),
    ]);
  }
}
