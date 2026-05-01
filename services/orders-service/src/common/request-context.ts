import { AsyncLocalStorage } from 'node:async_hooks';

export type RequestContextStore = {
  queryCount: number;
  requestId?: string;
  correlationId?: string;
  ip?: string;
  userAgent?: string;
  method?: string;
  path?: string;
};

export const requestContext = new AsyncLocalStorage<RequestContextStore>();
