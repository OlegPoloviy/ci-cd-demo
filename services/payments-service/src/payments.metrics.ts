import { metrics } from '@opentelemetry/api';

const meter = metrics.getMeter('payments-service');

const requestCounter = meter.createCounter('payments_requests_total', {
  description: 'Total payment RPC requests handled by operation and result.',
});

const errorCounter = meter.createCounter('payments_rpc_errors_total', {
  description: 'Total payment RPC errors by operation and gRPC status code.',
});

const durationHistogram = meter.createHistogram(
  'payments_request_duration_seconds',
  {
    description: 'Payment RPC duration in seconds by operation and result.',
    unit: 's',
  },
);

type PaymentResult = 'success' | 'idempotent_hit' | 'error';

export function recordPaymentRequest(
  operation: 'authorize' | 'get_payment_status',
  result: PaymentResult,
): void {
  requestCounter.add(1, { operation, result });
}

export function recordPaymentError(
  operation: 'authorize' | 'get_payment_status',
  code: string,
): void {
  errorCounter.add(1, { operation, code });
}

export function recordPaymentDuration(
  operation: 'authorize' | 'get_payment_status',
  durationSeconds: number,
  result: PaymentResult,
): void {
  durationHistogram.record(durationSeconds, { operation, result });
}
