# Evidence Pack

Цей файл призначений для доказів роботи системи під час рев'ю або live demo. Сюди можна вставити screenshots, посилання на Loom/відео, GitHub Actions runs та фактичні результати перевірок.

## 1. Deployed Service

Public URL:

```text
https://a869e44f1a0eb359-46-150-73-224.serveousercontent.com
```

Health-check command:

```bash
curl -k https://a869e44f1a0eb359-46-150-73-224.serveousercontent.com/health
```

Expected response:

```json
{"status":"ok"}
```

Screenshot:

<img width="979" height="45" alt="image" src="https://github.com/user-attachments/assets/9ced40d1-c0b2-452e-affd-65e3f89f0c42" />



## 2. API Description

Main public HTTP API used in the business flow:

| Step | Method | Endpoint | Auth | Purpose |
| --- | --- | --- | --- | --- |
| 1 | `POST` | `/api/v2/user` | No | Create demo user |
| 2 | `POST` | `/api/auth/login` | No | Get JWT access token |
| 3 | `GET` | `/api/products/top?minPrice=0&limit=1` | No | Get product for order |
| 4 | `POST` | `/api/orders` | JWT | Create order for authenticated user |
| 5 | `GET` | `/api/orders/:id` | JWT | Read order status |
| 6 | `GET` | `/api/orders/:id/payment-status` | JWT | Read payment status |

Main flow:

```text
create user -> login -> get product -> create order -> payment authorization -> RabbitMQ processing -> final order status -> payment status
```

Order lifecycle:

```text
PENDING -> PROCESSED
```


## 3. Main Flow E2E Proof

Script:

```bash
BASE_URL=https://a869e44f1a0eb359-46-150-73-224.serveousercontent.com node scripts/e2e-main-flow.mjs
```

If using the current Serveo TLS endpoint with Node:

```powershell
$env:NODE_TLS_REJECT_UNAUTHORIZED="0"
$env:BASE_URL="https://a869e44f1a0eb359-46-150-73-224.serveousercontent.com"
node scripts/e2e-main-flow.mjs
```

Observed result:

<img width="765" height="273" alt="image" src="https://github.com/user-attachments/assets/62bca97a-514a-4562-8bb5-958b1d11bf43" />


Manual curl proof from deployed environment:

```text
TODO: insert screenshot or terminal capture showing:
- user created
- login token received
- order created with PENDING
- order later returned as PROCESSED
- payment status returned
```

Loom/video:

```text
TODO: insert Loom link showing full deployed e2e flow
```

## 4. Logging Proof

HTTP request logger format:

```text
METHOD path status durationMs requestId
```

Useful command on the stage server:

```bash
docker logs myapp-stage-orders-api-1 --tail 200
```

Expected log evidence:

```text
POST /api/orders 201 ... requestId=...
GET /api/orders/:id 200 ... requestId=...
GET /api/orders/:id/payment-status 200 ... requestId=...
```

Order processing log evidence:

```text
Payment authorized for order ...
Handle message start: messageId=..., orderId=..., attempt=0
Order ... status changed to PROCESSED
Handle message result=success: messageId=..., orderId=..., attempt=0
```

Screenshot:

```text
TODO: insert screenshot of docker logs with HTTP request logs and order processing logs
```

Loom/video:

```text
TODO: insert Loom link showing logs during e2e run
```

## 5. Monitoring Proof

Local monitoring tools:

```text
Prometheus: http://localhost:9090
Grafana:    http://localhost:3003
RabbitMQ:   http://localhost:15672
```

Prometheus scrape targets from `prometheus.yml`:

```text
orders-api:9464
payments-api:9464
rabbitmq-exporter:9419
db-exporter:9187
payments-db-exporter:9187
```

Metrics/events relevant to the main flow:

```text
HTTP metrics from OpenTelemetry auto-instrumentation
orders_processing_retries_total
payments_requests_total
payments_request_duration_seconds
payments_rpc_errors_total
RabbitMQ queue metrics
Postgres exporter metrics
```

Prometheus screenshot:

```text
TODO: insert screenshot of Prometheus targets page showing UP targets
```

Grafana screenshot:

```text
TODO: insert screenshot of Grafana dashboard or Explore query
```

RabbitMQ screenshot:

```text
TODO: insert screenshot of RabbitMQ queues:
- orders.process
- orders.dlq
```

Loom/video:

```text
TODO: insert Loom link showing monitoring tool after running e2e
```

## 6. Tests Proof

Unit tests:

```bash
pnpm -C services/orders-service run test -- --runInBand
```

Observed result:

```text
Test Suites: 8 passed, 8 total
Tests: 10 passed, 10 total
```

Typecheck:

```bash
pnpm -C services/orders-service exec tsc --noEmit
```

Business logic test:

```text
services/orders-service/src/modules/orders/orders.service.spec.ts
```

What it proves:

```text
processOrderFromQueueIdempotent inserts processed message,
reserves stock,
sets priceAtPurchase,
sets status PROCESSED,
sets processedAt.
```

Screenshot:

```text
TODO: insert screenshot of successful unit tests
```

## 7. Pipeline Proof

GitHub Actions workflows:

```text
.github/workflows/pr-check.yml
.github/workflows/build-and-stage.yml
.github/workflows/main-flow-e2e.yml
.github/workflows/deploy-production.yml
```

Stage pipeline:

```text
push to develop -> build images -> push to GHCR -> deploy stage -> health-check -> stage e2e
```

Production pipeline:

```text
manual production deploy -> download release manifest -> pull GHCR images -> run migrations -> recreate production stack -> health-check -> production e2e/smoke
```

Stage run link:

```text
TODO: insert GitHub Actions run URL for build-and-stage.yml
```

Main e2e run link:

```text
TODO: insert GitHub Actions run URL for main-flow-e2e.yml
```

Production deploy run link:

```text
TODO: insert GitHub Actions run URL for deploy-production.yml
```

Screenshots:

```text
TODO: insert screenshot of green GitHub Actions run
TODO: insert screenshot of release-manifest.json artifact
TODO: insert screenshot of docker ps on stage server
```

## 8. Docker Runtime Proof

Stage server command:

```bash
docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}'
```

Expected running containers:

```text
myapp-stage-orders-api-1
myapp-stage-payments-api-1
myapp-stage-db-1
myapp-stage-payments-db-1
myapp-stage-rabbitmq-1
myapp-stage-minio-1
```

Screenshot:

```text
TODO: insert screenshot of docker ps output on stage server
```

## 9. Live Demo Checklist

Recommended demo order:

1. Open deployed `/health`.
2. Run `scripts/e2e-main-flow.mjs` against deployed URL.
3. Show order status `PROCESSED`.
4. Show payment status.
5. Show `docker logs` with HTTP and queue processing logs.
6. Show GitHub Actions pipeline run.
7. Show Prometheus/Grafana/RabbitMQ evidence if available.
8. Briefly show source code:
   - `OrdersController`
   - `OrdersService`
   - `OrdersProcessorService`
   - `RabbitmqService`
   - `orders.service.spec.ts`
