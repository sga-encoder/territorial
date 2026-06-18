import { Identifiable } from './identifiable';

/** Payload to create a resource: the UI model without its backend-assigned id. */
export type CreateModel<TModel extends Identifiable> = Omit<TModel, 'id'>;
