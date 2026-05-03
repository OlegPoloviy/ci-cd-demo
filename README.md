# Orders Processing System

Навчальний backend-проєкт на NestJS, який демонструє повний бізнес-контур обробки замовлення: створення замовлення через API, авторизацію доступу, збереження в Postgres, асинхронну обробку через RabbitMQ, зміну статусу та повторне отримання результату.

## Склад системи

- `services/orders-service` - основний NestJS HTTP/GraphQL/WebSocket сервіс.
- `services/payments-service` - NestJS gRPC сервіс для авторизації платежів.
- Postgres для `orders-service`.
- Окремий Postgres для `payments-service`.
- RabbitMQ для фонового сценарію `orders.process`.
- MinIO для S3-compatible storage.
- Prometheus, Grafana та exporters для локальної спостережуваності.

Основна бізнес-сутність - `Order`. Вона має життєвий цикл:

```text
PENDING -> PROCESSED
```

## Головний наскрізний контур

Основний сценарій:

```text
create user -> login -> get product -> create order -> authorize payment -> publish queue message -> process order -> get final order status -> get payment status
```

Що покриває контур:

- клієнт викликає API;
- DTO проходить validation через global `ValidationPipe`;
- `POST /api/orders` вимагає JWT;
- користувач може створити order тільки для себе, staff може діяти ширше;
- замовлення зберігається в Postgres зі статусом `PENDING`;
- payment авторизується через `payments-service` gRPC;
- RabbitMQ отримує повідомлення `orders.process`;
- worker списує stock, фіксує `priceAtPurchase`, виставляє `PROCESSED`;
- результат читається через `GET /api/orders/:id`;
- payment status читається через `GET /api/orders/:id/payment-status`;
- проходження видно в HTTP logs, order processing logs і метриках.

## Deployed Service

Поточний deployed endpoint:

```text
https://a869e44f1a0eb359-46-150-73-224.serveousercontent.com
```

Health-check:

```bash
curl -k https://a869e44f1a0eb359-46-150-73-224.serveousercontent.com/health
```

Очікувана відповідь:

```json
{"status":"ok"}
```

Повний контур був перевірений на цьому endpoint. Приклад результату:

```json
{
  "ok": true,
  "finalStatus": "PROCESSED",
  "paymentStatus": "1"
}
```

## Локальний запуск через Docker

Потрібно:

- Docker + Docker Compose plugin;
- Node.js 20+;
- pnpm 9.

Створити локальний `.env`:

```bash
cp .env.example .env
```

Для локального Docker запуску значення `DB_HOST`, `PAYMENTS_DB_HOST`, `AWS_ENDPOINT`, `RABBITMQ_URL` мають вказувати на compose service names (`db`, `payments-db`, `minio`, `rabbitmq`). Найпростіше взяти значення з `.env.e2e.example` або адаптувати `.env.example`.

Підняти залежності:

```bash
docker compose up -d --build
```

Запустити migrations і seed:

```bash
docker compose --profile tools run --rm migrate
docker compose --profile tools run --rm seed
```

Підняти API сервіси та observability:

```bash
docker compose up -d --build payments-api orders-api prometheus grafana
```

Перевірити:

```bash
curl http://localhost:8080/health
```

Зупинити локальний stack:

```bash
docker compose down
```

Повністю прибрати volumes:

```bash
docker compose down -v
```

## Real E2E локально

Для ізольованого e2e середовища:

```bash
cp .env.e2e.example .env.e2e
cp .env.e2e .env
```

Підняти e2e stack:

```bash
docker compose -p security-homework-e2e --env-file .env.e2e up -d --build db rabbitmq minio payments-db
docker compose -p security-homework-e2e --env-file .env.e2e --profile tools run --rm migrate
docker compose -p security-homework-e2e --env-file .env.e2e --profile tools run --rm seed
docker compose -p security-homework-e2e --env-file .env.e2e up -d --build payments-api orders-api
```

Запустити головний сценарій:

```bash
BASE_URL=http://localhost:18080 node scripts/e2e-main-flow.mjs
```

Очікуваний результат:

```json
{
  "ok": true,
  "finalStatus": "PROCESSED"
}
```

Прибрати e2e stack:

```bash
docker compose -p security-homework-e2e --env-file .env.e2e down -v --remove-orphans
```

## Тести

Unit tests для `orders-service`:

```bash
pnpm -C services/orders-service run test -- --runInBand
```

Typecheck:

```bash
pnpm -C services/orders-service exec tsc --noEmit
```

Real e2e test:

```bash
BASE_URL=http://localhost:18080 pnpm e2e:main-flow
```

Є окремий unit-test бізнес-логіки без HTTP:

```text
services/orders-service/src/modules/orders/orders.service.spec.ts
```

Він перевіряє `processOrderFromQueueIdempotent`: idempotency message insert, stock reservation, `priceAtPurchase`, `PROCESSED`, `processedAt`.

## Конфігурація

Основні env групи:

- `PORT` - зовнішній HTTP port на host. У Docker контейнері `orders-api` слухає `3000`.
- `DB_*` - база `orders-service`.
- `PAYMENTS_DB_*` - база `payments-service`.
- `PAYMENTS_GRPC_*` - gRPC endpoint payments service.
- `JWT_SECRET`, `JWT_EXPIRES_IN` - auth.
- `RABBITMQ_*` - RabbitMQ credentials, URL, queue names, retry settings.
- `AWS_*`, `MINIO_*` - S3/MinIO конфігурація.

RabbitMQ env naming normalized:

```text
RABBITMQ_USER
RABBITMQ_PASSWORD
RABBITMQ_URL
RABBITMQ_PREFETCH
RABBITMQ_QUEUE_ORDERS
RABBITMQ_QUEUE_DLQ
RABBITMQ_RETRY_COUNT
RABBITMQ_RETRY_DELAY
```

`*.example` файли містять приклади, реальні секрети не повинні комітитись.

## Спостережуваність

Health endpoint:

```text
GET /health
```

HTTP request logs містять:

```text
METHOD path status durationMs requestId
```

Ключові order logs:

- `Payment authorized for order ...`
- `Handle message start ...`
- `Order ... status changed to PROCESSED`
- retry/DLQ події для `orders.process`

Локальні observability endpoints:

```text
Prometheus: http://localhost:9090
Grafana:    http://localhost:3003
RabbitMQ:   http://localhost:15672
```

Prometheus scrape targets описані в `prometheus.yml`:

- `orders-api:9464`
- `payments-api:9464`
- RabbitMQ exporter
- Postgres exporters

## CI/CD

Workflows:

- `.github/workflows/pr-check.yml` - install, lint, tests, Docker build.
- `.github/workflows/build-and-stage.yml` - build/push images to GHCR, deploy stage, health-check, stage e2e.
- `.github/workflows/main-flow-e2e.yml` - real Docker e2e on `main` або manual run.
- `.github/workflows/deploy-production.yml` - manual production deploy from selected release manifest.

Stage deploy uses self-hosted runner label:

```yaml
runs-on: [self-hosted, stage]
```

Production deploy uses:

```yaml
runs-on: [self-hosted, prod]
```

Deploy images:

- `orders-api` - runtime API.
- `payments` - runtime payments service.
- `orders-tools` - orders migrations/seed image.
- `payments-migrate` - payments migrations image.

Stage deploy runs migrations and seed before `orders-api` starts. Production deploy runs migrations; seed should be used only if the environment is intended to contain demo data.

## Безпека

- JWT authentication.
- Resource authorization for orders: owner або staff.
- Role authorization for list orders and courier assignment.
- Helmet security headers.
- HTTP errors are normalized by global exception filter.
- Secrets are expected through env/GitHub Secrets, not hardcoded values.

Swagger should be enabled only for local/stage review, not for public production exposure.