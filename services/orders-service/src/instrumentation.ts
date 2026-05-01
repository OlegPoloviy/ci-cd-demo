import { NodeSDK } from '@opentelemetry/sdk-node';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';

const prometheusExporter = new PrometheusExporter({
  port: Number(process.env.OTEL_PROMETHEUS_PORT ?? 9464),
  endpoint: '/metrics',
});

const sdk = new NodeSDK({
  serviceName: process.env.OTEL_SERVICE_NAME ?? 'orders-api',

  metricReader: prometheusExporter,

  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-dns': { enabled: false },
      '@opentelemetry/instrumentation-net': { enabled: false },
    }),
  ],
});

sdk.start();
