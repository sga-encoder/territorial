// Visual layer type vocabulary (capa `visual`). This layer is decorative,
// canvas-driven chrome that is NEITHER a kit atom (RN-UI-02/05 keep `components/ui`
// logic-free) NOR a data-driven composition of the kit (capa `dynamic` composes
// kit components). A `visual` piece paints its OWN pixels from theme tokens.
//
// Mirroring RN-UI-01 for this sibling layer: every public input union lives
// here, and consumers import these types from the `components/visual` barrel —
// never from component files. Semantic unions only (no free strings/magic
// numbers leaking into templates).

/** Particle count preset — mapped to an area-based count inside the component. */
export type ParticleDensity = 'sparse' | 'balanced' | 'dense';

/** Base drift speed preset (px/frame is resolved in the component). */
export type ParticleSpeed = 'calm' | 'normal' | 'lively';

/** How particles react to the pointer within its influence radius. */
export type ParticlePointerEffect = 'repel' | 'attract' | 'none';
