import { AsyncLocalStorage } from 'node:async_hooks';

export type RequestContextStore = {
  queryCount: number;
};

export const requestContext = new AsyncLocalStorage<RequestContextStore>();
