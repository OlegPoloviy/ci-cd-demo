# Checklist відповідності мінімальним вимогам

Оцінка зроблена за кодом і конфігами в репозиторії станом на 2026-05-01.

Статуси:

- `[x]` відповідає
- `[~]` частково відповідає / є, але варто підсилити
- `[ ]` поки не підтверджено або не вистачає

## 1. Щонайменше один NestJS-сервіс

- `[x]` Виконано.
- Доказ:
  - `services/orders-service` — основний NestJS HTTP/GraphQL/WebSocket сервіс.
  - `services/payments-service` — окремий NestJS gRPC сервіс.
- Що додати:
  - Нічого критичного.

## 2. Щонайменше один основний бізнес-модуль

- `[x]` Виконано.
- Доказ:
  - У `orders-service` є повноцінні модулі `orders`, `products`, `files`, `user`, `order-tracking`.
  - Основний сценарій виглядає як робота із замовленнями: створення замовлення, статус оплати, призначення кур'єра, трекінг.
- Що додати:
  - За бажанням описати в README, який саме сценарій є “головним”.

## 3. Постійне зберігання даних

- `[x]` Виконано.
- Доказ:
  - Postgres у `compose.yaml` для `orders-service` і окремий `payments-db` для `payments-service`.
  - Є TypeORM, entities і migrations в обох сервісах.
  - Є volume-и `pgdata`, `payments_pgdata`, `minio_data`, `rabbit_data`.
- Що додати:
  - Нічого критичного.

## 4. Автентифікація та перевірка доступу хоча б до одного захищеного сценарію

- `[x]` Мінімально виконано.
- Доказ:
  - `auth/login`, JWT strategy, `JwtAuthGuard`, `UserRoleGuard`.
  - Захищені сценарії вже є:
    - `POST /files/presign`
    - `POST /files/complete`
    - `PATCH /api/v2/user/:id/role`
    - `GET /auth/me`
    - WebSocket-перевірка токена в `delivery.gateway.ts`
- Що додати:
  - Захистити також основні order-ендпоїнти, якщо саме вони є головним сценарієм.
  - Додати тести на `allowed/denied` для ролей.

## 5. Валідація вхідних даних для основного контуру

- `[x]` Виконано.
- Доказ:
  - У `main.ts` ввімкнено глобальний `ValidationPipe` з `whitelist`, `forbidNonWhitelisted`, `transform`.
  - Є DTO з `class-validator` для login, create order, assign courier, file upload та інших сценаріїв.
- Що додати:
  - Посилити валідацію для WebSocket payload-ів, бо частина перевірок там робиться вручну.

## 6. Щонайменше один асинхронний, фоновий або відкладений сценарій

- `[x]` Виконано.
- Доказ:
  - RabbitMQ інтеграція.
  - `OrdersProcessorService` підписується на `orders.process`, обробляє повідомлення, робить retry і DLQ.
  - Є окремий внутрішній `payments-service` через gRPC.
- Що додати:
  - Добре б додати інтеграційний тест саме на queue processing.

## 7. Локальний запуск у Docker для всіх компонентів, потрібних для головного сценарію

- `[x]` Виконано.
- Доказ:
  - `compose.yaml` піднімає `orders-api`, `payments-api`, обидві БД, RabbitMQ, MinIO.
  - Є окремі migrate/seed сервіси.
- Що додати:
  - Додати коротку інструкцію “одна команда для старту + одна команда для seed”, якщо її ще немає в README.

## 8. Задеплоєний екземпляр системи у будь-якому зовнішньому середовищі

- `[~]` Частково.
- Що вже є:
  - Є stage/prod docker-compose конфіги в `deploy/`.
  - Є GitHub Actions для `build-and-stage.yml` і `deploy-production.yml`.
  - Є health-check після деплою.
- Чого не вистачає:
  - У репозиторії немає явного підтвердження публічного URL або зовнішнього хоста.
  - У workflow `environment.url` вказані `http://localhost:8080` і `http://localhost:8081`, це схоже на self-hosted runner, а не на зовнішнє середовище з доступним endpoint.
- Що додати:
  - Додати в README або окремий `DEPLOYMENT.md` реальний URL stage/prod.
  - Додати скріншот або короткий доказ доступності `/health` із зовнішнього середовища.
  - Якщо деплой справді зовнішній, прибрати `localhost` з опису environment URL і вказати реальний endpoint.

## 9. Базова спостережуваність: health-check, логи та хоча б один інструмент моніторингу

- `[~]` Частково.
- Що вже є:
  - `GET /health` в `orders-service`.
  - Docker healthcheck-и для БД, RabbitMQ, MinIO.
  - Є application logs через `Logger`, exception filter, DB logger, audit logging.
  - Є performance baseline з `k6` у `scripts/` і `BASELINE.md`.
- Чого не вистачає:
  - Не знайшов реальної інтеграції моніторингу в коді або compose:
    - немає Prometheus/Grafana/OpenTelemetry/Sentry integration
    - є `OTEL_*` у локальному `.env`, але в коді це не використовується
  - `k6` є корисним для навантаження, але це не постійний інструмент моніторингу середовища.
- Що додати:
  - Найпростіший варіант: Prometheus metrics endpoint + Prometheus/Grafana або хоча б Sentry.
  - Мінімум для домашки:
    - експортувати HTTP/queue/DB метрики
    - додати сервіс моніторингу в docker-compose
    - описати, як перевірити метрики локально

## 10. Автоматизовані тести

- `[x]` Мінімально виконано.
- Доказ:
  - В `orders-service` є unit/spec тести і `test/app.e2e-spec.ts`.
  - У `payments-service` теж є spec/e2e файли.
- Зауваження:
  - Поточні e2e тести дуже базові, схожі на стартовий шаблон `Hello World`.
  - Не видно сильного покриття головного бізнес-сценарію: login, create order, payment status, queue processing, role checks.
- Що додати:
  - 1 e2e happy-path для головного сценарію.
  - 1 e2e negative-path для auth/authorization.
  - 1 integration test для RabbitMQ/processor або хоча б сервісної обробки повідомлення.

## 11. Автоматизований pipeline для збірки та перевірок

- `[x]` Мінімально виконано.
- Доказ:
  - `pr-check.yml` запускає install, lint, tests і docker build.
  - `build-and-stage.yml` збирає й пушить образи та деплоїть stage.
  - `deploy-production.yml` деплоїть production вручну з вибраного run.
- Що варто покращити:
  - `pr-check.yml` перевіряє тести тільки `orders-service`.
  - Для `payments-service` у pipeline зараз є build, але немає окремого запуску тестів.
  - Не видно окремого кроку з e2e тестами головного сценарію.
- Що додати:
  - Запуск тестів для `payments-service`.
  - Окремий job або step для e2e/integration перевірок.
  - За бажанням security checks: `npm audit`, secret scanning, SAST.

---

## Підсумок

### Уже відповідає мінімальним вимогам

- `[x]` щонайменше один NestJS-сервіс
- `[x]` щонайменше один основний бізнес-модуль
- `[x]` постійне зберігання даних
- `[x]` автентифікація та перевірка доступу щонайменше до одного захищеного сценарію
- `[x]` валідація вхідних даних для основного контуру
- `[x]` щонайменше один асинхронний, фоновий або відкладений сценарій
- `[x]` локальний запуск у Docker для всіх компонентів, потрібних для головного сценарію
- `[x]` автоматизовані тести
- `[x]` автоматизований pipeline для збірки та перевірок

### Потрібно доповнити або краще підтвердити

- `[~]` задеплоєний екземпляр системи у зовнішньому середовищі
- `[~]` базова спостережуваність у частині саме моніторингу
- `[~]` тести й pipeline варто довести саме до рівня головного бізнес-сценарію

## Найкоротший practical TODO

- `[ ]` Додати підтвердження реального зовнішнього URL для stage/prod.
- `[ ]` Додати хоча б один справжній інструмент моніторингу: Prometheus/Grafana, Sentry або OpenTelemetry.
- `[ ]` Додати e2e тест на основний сценарій замовлення.
- `[ ]` Додати auth/authorization tests для захищених endpoint-ів.
- `[ ]` Додати tests step для `payments-service` у CI.
- `[ ]` Зафіксувати в README, який саме сценарій вважається головним і як його прогнати локально.
