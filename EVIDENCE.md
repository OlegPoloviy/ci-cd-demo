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


Loom video covering all of things:
https://www.loom.com/share/ca8e3e704c584d2fad03ace8b7491524

