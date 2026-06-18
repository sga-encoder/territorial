// Visual layer public surface — decorative, canvas-driven chrome. NOT kit atoms
// (RN-UI-02/05 keep `components/ui` logic-free) and NOT data-driven kit compositions
// (capa `dynamic`): these pieces carry real logic and paint their own pixels from
// theme tokens. Features import from THIS barrel only (mirrors RN-UI-01), never
// from individual component files. Docs: src/docs/visual/.
export { GlassStage } from './glass-stage/glass-stage';
export { ParticlesBackground } from './particles/particles-background';
export type * from './types';
