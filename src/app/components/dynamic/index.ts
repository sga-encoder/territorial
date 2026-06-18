// Dynamic layer public surface — DATA-DRIVEN compositions over the UI Kit.
// These are NOT kit atoms (RN-UI-05): they live in components/dynamic, carry logic
// and pipelines, and compose components/ui. Features import dynamic pieces from
// THIS barrel (never reach into individual files), exactly like the kit.
export { Chatbot } from './chatbot';
export { DynamicCell } from './dynamic-cell';
export { DynamicInput } from './dynamic-input';
export { DynamicTable } from './dynamic-table';
export { Filter } from './filter';
export { FormGenerator } from './form-generator';
export { PageHeader } from './page-header';
export type * from './types';
