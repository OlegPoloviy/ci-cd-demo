# Evidence Pack
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

Observability:
<img width="1469" height="491" alt="image" src="https://github.com/user-attachments/assets/f5919416-ca9a-412d-82fc-bde7091e9c2b" />
Those logs are shown in our server after creating an order and changing the status

## Prometheus & Grafana
Targets in Prometheus
<img width="2517" height="984" alt="image" src="https://github.com/user-attachments/assets/b77a4623-c3b1-49bf-895a-69ca02aba415" />

# Grafana dashboards
<img width="2217" height="857" alt="image" src="https://github.com/user-attachments/assets/db2f3112-1de7-476c-8218-6d579b90e004" />

<img width="2201" height="529" alt="image" src="https://github.com/user-attachments/assets/908b9628-cec7-4473-8209-6573a620821c" />

<img width="2234" height="663" alt="image" src="https://github.com/user-attachments/assets/73a394d6-78d7-4e1a-a280-3ae3ac3a7316" />

<img width="2165" height="740" alt="image" src="https://github.com/user-attachments/assets/958d5c32-9a84-4313-8b95-bdd81afab1ea" />

# Github actions checks 
<img width="2500" height="801" alt="image" src="https://github.com/user-attachments/assets/5397c9ba-ee50-45a6-9607-c72b8f6b5b12" />
## Self hosted runner

<img width="835" height="199" alt="image" src="https://github.com/user-attachments/assets/6b1f54de-86e8-4381-9579-24f8b5d9d0b8" />




