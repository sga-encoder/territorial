import { isPlatformBrowser } from '@angular/common';
import {
  afterNextRender,
  Component,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  NgZone,
  PLATFORM_ID,
  viewChild,
} from '@angular/core';
// Type-only: erased at runtime so `three` never lands in the SSR/main bundle.
// The real module is pulled lazily with a dynamic import() inside the browser.
import type * as ThreeNs from 'three';
import { ThemeService } from '../../ui';
import type { ParticleDensity, ParticlePointerEffect, ParticleSpeed } from '../types';

/** Verbose console diagnostics for the WebGL pipeline (off in normal use). */
const DEBUG = false;
const TAG = '[particles]';

// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  CONFIG — ajusta todo desde aquí. Recarga la página para ver los cambios.  ║
// ╚══════════════════════════════════════════════════════════════════════════╝
const CONFIG = {
  // ── COLOR ───────────────────────────────────────────────────────────────
  color: {
    dark: '#212d57ff', //  color del polvo en tema OSCURO (#rgb o #rrggbb)
    light: '#819ACC', // color del polvo en tema CLARO
    shadeMin: 0.65, //   variación de tono por grano (1 = color exacto)
    shadeMax: 1.7, //    súbelo para más contraste entre granos
    opacity: 0.14, //    opacidad por trazo (la estela la acumula)
  },
  // ── CANTIDAD ────────────────────────────────────────────────────────────
  count: {
    // px² por partícula: MENOR = más denso ("más lleno").
    areaPerParticle: { sparse: 600, balanced: 340, dense: 200 } as Record<ParticleDensity, number>,
    max: 10000, //       tope duro de partículas (rendimiento)
  },
  // ── TAMAÑO ──────────────────────────────────────────────────────────────
  size: {
    base: 2.5, //        diámetro base en px
    scaleMin: 0.5, //    multiplicador mínimo por grano
    scaleMax: 22, //     multiplicador máximo (bolas grandes "tipo fondo")
    scaleExp: 3.2, //    >1 ⇒ pocas grandes, muchas pequeñas
  },
  // ── VELOCIDAD / MOVIMIENTO ──────────────────────────────────────────────
  motion: {
    returnSpeed: 0.045, // fuerza del resorte de retorno a casa
    damping: 0.8, //       fricción (menor = más amortiguado)
    wobbleAmp: 8, //       amplitud de oscilación cerca del cursor (px)
    wobbleSpeed: 0.05, //  velocidad del ciclo (rad/frame)
    wobbleRadius: 200, //  solo oscilan los granos a esta distancia del mouse
    pointerRadius: 160, // alcance de la repulsión del mouse
    pointerPush: 3.2, //   fuerza de repulsión
  },
  // ── TIEMPO DE EFECTOS (clic / gota) ─────────────────────────────────────
  ripple: {
    growth: 6, //        px/frame que crece el anillo (mayor = más rápido)
    maxRadius: 340, //   radio donde muere la onda
    band: 55, //         grosor del frente de empuje
    push: 7, //          fuerza del anillo hacia afuera
    fade: 0.02, //       cuánto se apaga el anillo por frame
    pullRadius: 240, //  radio de agrupamiento hacia el clic
    pullForce: 2.2, //   fuerza de agrupamiento
    pullDecay: 0.9, //   qué tan rápido decae el agrupamiento (mayor = dura más)
    max: 8, //           ondas simultáneas máximas
  },
  // ── RENDER ──────────────────────────────────────────────────────────────
  render: {
    trailFade: 0.08, //  estela: MENOR = más larga (0 = infinita, 1 = sin estela)
    maxDpr: 2, //        tope de densidad de píxeles (nitidez vs. rendimiento)
  },
};

// Aliases derivados de CONFIG — no editar (cambia los valores arriba).
const DENSITY_AREA_PER_PARTICLE = CONFIG.count.areaPerParticle;
const MAX_PARTICLES = CONFIG.count.max;
const MAX_DPR = CONFIG.render.maxDpr;
const POINTER_RADIUS = CONFIG.motion.pointerRadius;
const POINTER_PUSH = CONFIG.motion.pointerPush;
const RETURN_SPEED = CONFIG.motion.returnSpeed;
const DAMPING = CONFIG.motion.damping;
const WOBBLE_AMP = CONFIG.motion.wobbleAmp;
const WOBBLE_SPEED = CONFIG.motion.wobbleSpeed;
const WOBBLE_RADIUS = CONFIG.motion.wobbleRadius;
const SHADE_MIN = CONFIG.color.shadeMin;
const SHADE_MAX = CONFIG.color.shadeMax;
const RIPPLE_GROWTH = CONFIG.ripple.growth;
const RIPPLE_MAX_RADIUS = CONFIG.ripple.maxRadius;
const RIPPLE_BAND = CONFIG.ripple.band;
const RIPPLE_PUSH = CONFIG.ripple.push;
const RIPPLE_FADE = CONFIG.ripple.fade;
const RIPPLE_PULL_RADIUS = CONFIG.ripple.pullRadius;
const RIPPLE_PULL_FORCE = CONFIG.ripple.pullForce;
const RIPPLE_PULL_DECAY = CONFIG.ripple.pullDecay;
const MAX_RIPPLES = CONFIG.ripple.max;
const POINT_SIZE = CONFIG.size.base;
const SIZE_SCALE_MIN = CONFIG.size.scaleMin;
const SIZE_SCALE_MAX = CONFIG.size.scaleMax;
const SIZE_SCALE_EXP = CONFIG.size.scaleExp;
const POINT_OPACITY = CONFIG.color.opacity;
const DUST_COLOR_DARK = CONFIG.color.dark;
const DUST_COLOR_LIGHT = CONFIG.color.light;
const TRAIL_FADE = CONFIG.render.trailFade;

/**
 * Build a soft round sprite on an offscreen canvas (white core → transparent
 * edge). Tinted at render time by `PointsMaterial.color`, so we use NO custom
 * GLSL — PointsMaterial is the battle-tested path that links on every driver.
 */
function createSpriteTexture(THREE: typeof ThreeNs, doc: Document): ThreeNs.CanvasTexture {
  const size = 64;
  const canvas = doc.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.5, 'rgba(255,255,255,0.85)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

interface Particle {
  homeX: number;
  homeY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  /** Phase offset so each grain wobbles on its own cycle. */
  phase: number;
  /** Monochromatic brightness multiplier (base color × shade) for tonal variety. */
  shade: number;
}

interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  strength: number; // outward ring, 1 → 0
  pull: number; // inward gather, 1 → 0 (decays faster than the ring)
}

interface Rgb {
  r: number;
  g: number;
  b: number;
}

/**
 * `ui-particles-background` — decorative particle field rendered with **three.js**
 * (WebGL). The CPU owns the physics (home position, spring return, pointer repel,
 * water-drop ripples); each frame the particle positions are streamed into a
 * `THREE.Points` BufferGeometry and drawn by a `PointsMaterial` tinted from the
 * theme token, using a generated soft round sprite texture (no custom GLSL).
 *
 * Behaviours:
 *  - Particles rest at their home positions and spring back when disturbed.
 *  - Pointer movement repels/attracts particles within the influence radius.
 *  - Click / tap emits an expanding ring that pushes particles outward.
 *  - Color tracks the `--color-primary` token and flips with the theme.
 *
 * Lives in the sibling `visual` layer (logic + own pixels), not the kit. The
 * `three` module is lazy-loaded in the browser only, so SSR never touches WebGL.
 */
@Component({
  selector: 'ui-particles-background',
  template: `<canvas #canvas aria-hidden="true" class="block h-full w-full"></canvas>`,
  host: {
    class: 'pointer-events-none fixed inset-0 z-10 block overflow-hidden',
    'aria-hidden': 'true',
  },
})
export class ParticlesBackground {
  readonly density = input<ParticleDensity>('balanced');
  readonly speed = input<ParticleSpeed>('normal');
  readonly pointerEffect = input<ParticlePointerEffect>('repel');

  private readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly hostRef = inject(ElementRef<HTMLElement>);
  private readonly theme = inject(ThemeService);
  private readonly zone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  // three.js handles (null until the lazy import resolves in the browser).
  private three: typeof ThreeNs | null = null;
  private renderer: ThreeNs.WebGLRenderer | null = null;
  private scene: ThreeNs.Scene | null = null;
  private camera: ThreeNs.OrthographicCamera | null = null;
  private geometry: ThreeNs.BufferGeometry | null = null;
  private material: ThreeNs.PointsMaterial | null = null;
  private sprite: ThreeNs.Texture | null = null;
  private points: ThreeNs.Points | null = null;

  // Trail pass: a fullscreen quad that fades the previous frame instead of
  // clearing it, so moving grains leave a short streak.
  private fadeScene: ThreeNs.Scene | null = null;
  private fadeCamera: ThreeNs.OrthographicCamera | null = null;
  private fadeMaterial: ThreeNs.MeshBasicMaterial | null = null;
  private fadeGeometry: ThreeNs.BufferGeometry | null = null;

  private particles: Particle[] = [];
  private readonly ripples: Ripple[] = [];
  /** Flat xyz buffer mirrored into the geometry each frame. */
  private positions: Float32Array | null = null;
  /** Flat rgb buffer (per-grain monochromatic shade); refilled on theme flip. */
  private colors: Float32Array | null = null;

  private width = 1;
  private height = 1;

  private pointerX = -Infinity;
  private pointerY = -Infinity;
  private pointerActive = false;

  private color: Rgb = { r: 74, g: 143, b: 231 };
  private animationFrameId = 0;
  private prefersReducedMotion = false;
  private frame = 0;
  /** Monotonic clock (frames) driving the ambient wobble. */
  private time = 0;
  /** When set, wipe the accumulated trail buffer next frame (e.g. on theme flip). */
  private resetTrail = false;

  constructor() {
    // Re-resolve color whenever the theme flips.
    effect(() => {
      this.theme.scheme();
      if (this.isBrowser && this.material !== null) {
        this.refreshColor();
        if (this.prefersReducedMotion) this.renderFrame();
      }
    });

    // Rebuild particles when the density input changes.
    effect(() => {
      this.density();
      if (this.isBrowser && this.renderer !== null) this.buildParticles();
    });

    afterNextRender(() => void this.setup());
  }

  // ── Lifecycle ───────────────────────────────────────────────────────────────

  private async setup(): Promise<void> {
    try {
      await this.setupGl();
    } catch (error) {
      console.error(`${TAG} setup failed — WebGL pipeline did not start`, error);
    }
  }

  private async setupGl(): Promise<void> {
    if (DEBUG) console.info(`${TAG} setup() start`, { isBrowser: this.isBrowser });

    const view = this.hostRef.nativeElement.ownerDocument.defaultView;
    this.prefersReducedMotion =
      view?.matchMedia('(prefers-reduced-motion: reduce)').matches ?? false;

    let destroyed = false;
    this.destroyRef.onDestroy(() => {
      destroyed = true;
    });

    // Lazy WebGL: keep three out of the server bundle and off the critical path.
    const THREE = await import('three');
    if (destroyed) return;
    this.three = THREE;
    if (DEBUG) console.info(`${TAG} three.js loaded · r${THREE.REVISION}`);

    const canvas = this.canvasRef().nativeElement;
    canvas.addEventListener('webglcontextlost', (e) => console.error(`${TAG} WebGL context LOST`, e));
    canvas.addEventListener('webglcontextcreationerror', (e) =>
      console.error(`${TAG} WebGL context creation error`, e),
    );

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      premultipliedAlpha: false, // shader emits straight alpha → correct page compositing.
      preserveDrawingBuffer: true, // keep the buffer between frames so trails accumulate.
    });
    renderer.setClearColor(0x000000, 0); // transparent: the page shows through.
    this.renderer = renderer;
    if (DEBUG) {
      const gl = renderer.getContext();
      console.info(`${TAG} renderer created`, {
        webgl2: renderer.capabilities.isWebGL2,
        maxTextureSize: renderer.capabilities.maxTextureSize,
        vendor: gl.getParameter(gl.VENDOR),
        renderer: gl.getParameter(gl.RENDERER),
      });
    }
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(0, 1, 0, 1, 0.1, 1000);
    this.camera.position.z = 100;

    // PointsMaterial + soft sprite texture: no custom GLSL, links on any driver.
    this.sprite = createSpriteTexture(THREE, this.hostRef.nativeElement.ownerDocument);
    this.material = new THREE.PointsMaterial({
      map: this.sprite,
      size: POINT_SIZE,
      sizeAttenuation: false, // constant pixel size (orthographic, screen-space).
      transparent: true,
      opacity: POINT_OPACITY,
      vertexColors: true, // per-grain monochromatic shade comes from the geometry.
      depthTest: false,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });
    // Per-grain size: patch the (already-working) points shader to multiply
    // gl_PointSize by an `aScale` attribute — safer than a from-scratch shader.
    this.material.onBeforeCompile = (shader) => {
      shader.vertexShader =
        'attribute float aScale;\n' +
        shader.vertexShader.replace('gl_PointSize = size;', 'gl_PointSize = size * aScale;');
    };
    this.refreshColor();
    if (DEBUG) console.info(`${TAG} color uniform`, this.color);

    // Trails: take over clearing ourselves so we can fade instead of wipe.
    // Skipped under reduced motion (a single static frame needs no trail).
    renderer.autoClear = false;
    if (!this.prefersReducedMotion) {
      this.fadeScene = new THREE.Scene();
      this.fadeCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      // CustomBlending so the quad MULTIPLIES the framebuffer down each frame:
      // result = dst * (1 - srcAlpha) → old grains decay, empty areas stay clear.
      this.fadeMaterial = new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: TRAIL_FADE,
        depthTest: false,
        depthWrite: false,
        blending: THREE.CustomBlending,
        blendEquation: THREE.AddEquation,
        blendSrc: THREE.ZeroFactor,
        blendDst: THREE.OneMinusSrcAlphaFactor,
      });
      this.fadeGeometry = new THREE.PlaneGeometry(2, 2);
      this.fadeScene.add(new THREE.Mesh(this.fadeGeometry, this.fadeMaterial));
    }

    const ro = new ResizeObserver(() => this.resize());
    ro.observe(this.hostRef.nativeElement);
    this.resize(); // sizes the renderer, builds particles and the Points object.

    if (DEBUG) {
      const host = this.hostRef.nativeElement;
      console.info(`${TAG} after first resize`, {
        hostClient: `${host.clientWidth}x${host.clientHeight}`,
        cssSize: `${this.width}x${this.height}`,
        canvasBuffer: `${canvas.width}x${canvas.height}`,
        particles: this.particles.length,
        reducedMotion: this.prefersReducedMotion,
      });
      if (host.clientWidth === 0 || host.clientHeight === 0) {
        console.warn(`${TAG} host has ZERO size — nothing will be visible. Check the host's positioned/sized ancestor.`);
      }
    }

    // The rAF loop + pointer listeners run OUTSIDE Angular: they only mutate
    // plain fields and paint, so they must never schedule change detection.
    this.zone.runOutsideAngular(() => {
      if (this.prefersReducedMotion) {
        this.renderFrame();
        this.destroyRef.onDestroy(() => {
          ro.disconnect();
          this.dispose();
        });
        return;
      }

      const target = (view ?? window) as EventTarget;
      const onMove = (e: Event): void => this.handlePointerMove(e as PointerEvent);
      const onDown = (e: Event): void => this.handlePointerDown(e as PointerEvent);
      const onLeave = (): void => {
        this.pointerActive = false;
      };
      // Capture phase: a button (or any element) that stops propagation on
      // pointerdown can't swallow the drop — every click/tap spawns a ripple.
      target.addEventListener('pointermove', onMove, { passive: true });
      target.addEventListener('pointerdown', onDown, { passive: true, capture: true });
      target.addEventListener('pointerleave', onLeave, { passive: true });

      this.loop();

      this.destroyRef.onDestroy(() => {
        target.removeEventListener('pointermove', onMove);
        target.removeEventListener('pointerdown', onDown, { capture: true } as EventListenerOptions);
        target.removeEventListener('pointerleave', onLeave);
        ro.disconnect();
        if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
        this.dispose();
      });
    });
  }

  private resize(): void {
    const host = this.hostRef.nativeElement;
    const renderer = this.renderer;
    const camera = this.camera;
    if (renderer === null || camera === null) return;

    const dpr = Math.min(host.ownerDocument.defaultView?.devicePixelRatio ?? 1, MAX_DPR);
    this.width = Math.max(1, host.clientWidth);
    this.height = Math.max(1, host.clientHeight);

    renderer.setPixelRatio(dpr);
    renderer.setSize(this.width, this.height, false); // false: CSS owns canvas size.

    // Orthographic camera in pixel space (y-down), matching the CPU physics.
    camera.left = 0;
    camera.right = this.width;
    camera.top = 0;
    camera.bottom = this.height;
    camera.updateProjectionMatrix();

    this.buildParticles();
  }

  // ── Particles ───────────────────────────────────────────────────────────────

  private buildParticles(): void {
    const THREE = this.three;
    if (THREE === null || this.scene === null || this.material === null) return;

    const count = Math.min(
      MAX_PARTICLES,
      Math.round((this.width * this.height) / DENSITY_AREA_PER_PARTICLE[this.density()]),
    );

    const particles: Particle[] = [];
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const scales = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const x = Math.random() * this.width;
      const y = Math.random() * this.height;
      const radius = 1.2 + Math.random() * 2.6;
      const alpha = 0.28 + Math.random() * 0.52;
      const phase = Math.random() * Math.PI * 2;
      const shade = SHADE_MIN + Math.random() * (SHADE_MAX - SHADE_MIN);
      particles.push({ homeX: x, homeY: y, x, y, vx: 0, vy: 0, radius, alpha, phase, shade });
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = 0;
      // Skewed toward small (Math.pow with EXP>1) so most grains are fine dust and
      // only a few balloon into large, near-background blobs.
      const sizeT = Math.pow(Math.random(), SIZE_SCALE_EXP);
      scales[i] = SIZE_SCALE_MIN + (SIZE_SCALE_MAX - SIZE_SCALE_MIN) * sizeT;
    }
    this.particles = particles;
    this.positions = positions;
    this.colors = colors;

    // Geometry size changes with count, so rebuild it (resize/density are rare).
    this.geometry?.dispose();
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));
    this.geometry = geometry;
    this.applyColors(); // fill the color buffer from the current theme base.

    if (this.points === null) {
      this.points = new THREE.Points(geometry, this.material);
      this.scene.add(this.points);
    } else {
      this.points.geometry = geometry;
    }

    if (this.prefersReducedMotion) this.renderFrame();
  }

  /** Fill the per-grain color buffer: base tint × each grain's monochromatic shade. */
  private applyColors(): void {
    const THREE = this.three;
    const colors = this.colors;
    const geometry = this.geometry;
    if (THREE === null || colors === null || geometry === null) return;

    const tmp = new THREE.Color();
    const { r, g, b } = this.color;
    for (let i = 0; i < this.particles.length; i++) {
      const s = this.particles[i].shade;
      // sRGB → linear conversion so vertex colors match the rest of the scene.
      tmp.setRGB(
        Math.min(1, (r / 255) * s),
        Math.min(1, (g / 255) * s),
        Math.min(1, (b / 255) * s),
        THREE.SRGBColorSpace,
      );
      colors[i * 3] = tmp.r;
      colors[i * 3 + 1] = tmp.g;
      colors[i * 3 + 2] = tmp.b;
    }
    const attr = geometry.getAttribute('color');
    if (attr !== undefined) attr.needsUpdate = true;
  }

  // ── Animation loop ──────────────────────────────────────────────────────────

  private readonly loop = (): void => {
    this.step();
    this.renderFrame();
    if (DEBUG && this.frame % 120 === 0) {
      console.info(`${TAG} heartbeat · frame ${this.frame} · particles ${this.particles.length}`);
    }
    this.frame++;
    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  private step(): void {
    this.time++;

    // Age & cull ripples (ring expands; the inward gather fades fast).
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const r = this.ripples[i];
      r.radius += RIPPLE_GROWTH;
      r.strength -= RIPPLE_FADE;
      r.pull *= RIPPLE_PULL_DECAY;
      if (r.radius > r.maxRadius || r.strength <= 0) this.ripples.splice(i, 1);
    }

    const mode = this.pointerEffect();

    for (const p of this.particles) {
      let fx = 0;
      let fy = 0;

      // Pointer force: moving the mouse pushes nearby grains away.
      if (mode !== 'none' && this.pointerActive) {
        const dx = p.x - this.pointerX;
        const dy = p.y - this.pointerY;
        const d = Math.hypot(dx, dy);
        if (d > 0 && d < POINTER_RADIUS) {
          const str = (1 - d / POINTER_RADIUS) * POINTER_PUSH;
          const dir = mode === 'attract' ? -1 : 1;
          fx += (dx / d) * str * dir;
          fy += (dy / d) * str * dir;
        }
      }

      // Ripple forces: first gather toward the click, then the ring splashes out.
      for (const rip of this.ripples) {
        const dx = p.x - rip.x;
        const dy = p.y - rip.y;
        const d = Math.hypot(dx, dy);
        if (d > 0) {
          // Inward gather (decays quickly) — grains group toward the click.
          if (rip.pull > 0.02 && d < RIPPLE_PULL_RADIUS) {
            const gather = (1 - d / RIPPLE_PULL_RADIUS) * rip.pull * RIPPLE_PULL_FORCE;
            fx -= (dx / d) * gather;
            fy -= (dy / d) * gather;
          }
          // Outward ring (the water-drop splash).
          const delta = Math.abs(d - rip.radius);
          if (delta < RIPPLE_BAND) {
            const wave = (1 - delta / RIPPLE_BAND) * rip.strength;
            fx += (dx / d) * RIPPLE_PUSH * wave;
            fy += (dy / d) * RIPPLE_PUSH * wave;
          }
        }
      }

      // Cyclic wobble ONLY near the pointer — grains farther away rest at home,
      // so the field is still except around the cursor. Amplitude fades with distance.
      let amp = 0;
      if (this.pointerActive) {
        const dxp = p.x - this.pointerX;
        const dyp = p.y - this.pointerY;
        const dp = Math.hypot(dxp, dyp);
        if (dp < WOBBLE_RADIUS) amp = (1 - dp / WOBBLE_RADIUS) * WOBBLE_AMP;
      }
      const targetX = p.homeX + Math.sin(this.time * WOBBLE_SPEED + p.phase) * amp;
      const targetY = p.homeY + Math.cos(this.time * WOBBLE_SPEED + p.phase) * amp;
      fx += (targetX - p.x) * RETURN_SPEED;
      fy += (targetY - p.y) * RETURN_SPEED;

      p.vx = (p.vx + fx) * DAMPING;
      p.vy = (p.vy + fy) * DAMPING;
      p.x += p.vx;
      p.y += p.vy;
    }
  }

  /** Stream CPU positions into the GPU buffer and draw one frame. */
  private renderFrame(): void {
    const renderer = this.renderer;
    const positions = this.positions;
    if (renderer === null || this.scene === null || this.camera === null) return;
    if (this.geometry === null || positions === null) return;

    let i = 0;
    for (const p of this.particles) {
      positions[i++] = p.x;
      positions[i++] = p.y;
      positions[i++] = 0;
    }
    this.geometry.getAttribute('position').needsUpdate = true;

    if (this.fadeScene !== null && this.fadeCamera !== null) {
      if (this.resetTrail) {
        renderer.clear(); // wipe stale accumulation (theme flip) so old color vanishes.
        this.resetTrail = false;
      } else {
        renderer.render(this.fadeScene, this.fadeCamera); // fade previous → trails.
      }
      renderer.render(this.scene, this.camera);
    } else {
      // No trail (reduced motion): wipe and draw a single clean frame.
      renderer.clear();
      renderer.render(this.scene, this.camera);
    }
  }

  // ── Event handlers ──────────────────────────────────────────────────────────

  private handlePointerMove(e: PointerEvent): void {
    const rect = this.canvasRef().nativeElement.getBoundingClientRect();
    this.pointerX = e.clientX - rect.left;
    this.pointerY = e.clientY - rect.top;
    this.pointerActive = true;
  }

  private handlePointerDown(e: PointerEvent): void {
    const rect = this.canvasRef().nativeElement.getBoundingClientRect();
    if (this.ripples.length >= MAX_RIPPLES) this.ripples.shift();
    this.ripples.push({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      radius: 0,
      maxRadius: RIPPLE_MAX_RADIUS,
      strength: 1,
      pull: 1,
    });
  }

  // ── Color & teardown ──────────────────────────────────────────────────────────

  private refreshColor(): void {
    // Manual base color per theme — tweak DUST_COLOR_DARK / DUST_COLOR_LIGHT above.
    const hex = this.theme.isDark() ? DUST_COLOR_DARK : DUST_COLOR_LIGHT;
    this.color = parseColor(hex) ?? this.color;
    this.applyColors(); // repaint every grain with the new theme base.
    this.resetTrail = true; // wipe the old accumulated color so the new one shows now.
  }

  private dispose(): void {
    this.geometry?.dispose();
    this.material?.dispose();
    this.sprite?.dispose();
    this.fadeGeometry?.dispose();
    this.fadeMaterial?.dispose();
    this.renderer?.dispose();
    this.renderer = null;
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function parseColor(raw: string): Rgb | null {
  const value = raw.trim(); // tolerate stray spaces, e.g. ' #141827'
  if (value.startsWith('#')) {
    const hex = value.slice(1);
    const full =
      hex.length === 3
        ? hex
          .split('')
          .map((c) => c + c)
          .join('')
        : hex;
    if (full.length < 6) return null;
    return {
      r: parseInt(full.slice(0, 2), 16),
      g: parseInt(full.slice(2, 4), 16),
      b: parseInt(full.slice(4, 6), 16),
    };
  }
  const channels = value.match(/\d+\.?\d*/g);
  if (!channels || channels.length < 3) return null;
  return { r: Number(channels[0]), g: Number(channels[1]), b: Number(channels[2]) };
}
