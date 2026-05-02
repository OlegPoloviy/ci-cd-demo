import { metrics } from '@opentelemetry/api';

const meter = metrics.getMeter('orders-service');

const retryCounter = meter.createCounter('orders_processing_retries_total', {
  description: 'Total order processing retries by queue and reason.',
});

export function recordOrderProcessingRetry(
  queue: string,
  reason: string,
): void {
  retryCounter.add(1, { queue, reason });
}
