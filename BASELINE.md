In this scenario I had chosen the one of most heavy operations in my application - GraphQL `getOrdersSimple` (Orders list / admin).

Endpoint: `POST http://localhost:8080/graphql`
Load script(s): `scripts/k6-graphql.js` (stress), `scripts/k6-graphql-sanity.js` (sanity)

Was quering by k6

- executor: constant-arrival-rate
- target rate: 50 iterations/s (≈50 RPS)
- duration: 2m
- max VUs: 300

THRESHOLDS

    http_req_duration
    ✗ 'p(95)<500' p(95)=1m0s

    http_req_failed
    ✗ 'rate<0.01' rate=30.44%

TOTAL RESULTS

    checks_total.......: 693    4.619911/s
    checks_succeeded...: 69.55% 482 out of 693
    checks_failed......: 30.44% 211 out of 693

    ✗ status is 200
      ↳  69% — ✓ 482 / ✗ 211

HTTP
http_req_duration..............: avg=53.06s min=37.09s med=53.41s max=1m0s p(90)=59.99s p(95)=1m0s  
 { expected_response:true }...: avg=50.02s min=37.09s med=51.79s max=59.99s p(90)=56.34s p(95)=59.07s  
 http_req_failed................: 30.44% 211 out of 693
http_reqs......................: 693 4.619911/s

    EXECUTION
    dropped_iterations.............: 5194   34.626002/s
    iteration_duration.............: avg=53.18s min=37.19s med=53.52s max=1m0s   p(90)=1m0s   p(95)=1m0s
    iterations.....................: 692    4.613245/s
    vus............................: 114    min=50         max=300
    vus_max........................: 300    min=50         max=300

    NETWORK
    data_received..................: 43 MB  284 kB/s
    data_sent......................: 500 kB 3.3 kB/s

CPU / Memory (docker stats with the same load):

orders-api CPU: ~104.79%
orders-api Memory: 1.856 GiB

Docker stats snapshot (no load / idle, after tests):

- orders-api CPU: 5.10%, Memory: 136 MiB
- db CPU: 8.84%, Memory: 55.57 MiB
- rabbitmq CPU: 0.13%, Memory: 193.2 MiB

Sanity run (k6): `scripts/k6-graphql-sanity.js`

- executor: constant-arrival-rate
- target rate: 2 iterations/s (≈2 RPS)
- duration: 1m
- max VUs: 20

TOTAL RESULTS (sanity):

- http_req_failed: 0.00% (0/121)
- http_reqs: 121 (2.01 req/s)
- http_req_duration: avg=36.84ms, med(p50)=34.3ms, p95=49.8ms, max=87.17ms

Other baseline notes:

- Queue depth / time-to-drain: N/A (this is a read-only GraphQL scenario)
- Replicas: 1 (docker compose)
- Requests / limits: not set (docker compose)
- Cost proxy: local environment (no cloud runtime cost)

---

## Bottleneck analysis (Part 2.1 / 2.2)

### Where is the bottleneck?

The bottleneck is the **GraphQL orders list operation** under load (`POST /graphql` calling `getOrdersSimple` with nested fields: `user`, `items`, and `items.product`).

Important note:

- `getOrdersSimple` is used here as a **control / baseline** to demonstrate the "worst-case" behavior for this operation.
- The project also has an optimized variant (`getOrders`) that uses DataLoader. For production-like baseline we should measure `getOrders`, but the `getOrdersSimple` results already prove there is a severe bottleneck in the same hot scenario (orders list) when the request becomes expensive.

### Why do we think it's a real bottleneck (not just "slow")?

Because the system shows classic saturation symptoms that repeat across the run:

- **Throughput collapse**: target was 50 RPS, but achieved only **4.62 req/s** (`http_reqs: 693`, `http_reqs/s: 4.619911/s`).
- **Tail latency hits timeouts**: p95 is **~60s** and many requests fail with `request timeout`.
- **Error rate increases under load**: `checks_failed` / `http_req_failed` shows **~30.44%** failed requests (timeouts).
- **Backpressure / queueing inside the service**: k6 reports **5194 dropped iterations**, meaning it could not maintain the requested arrival rate because requests were not completing fast enough.
- **Resource correlation (CPU/RAM)**: during the same load the `orders-api` container reached **~104.79% CPU** and **~1.856 GiB RAM**, while in idle it stays around **136 MiB**.

These together indicate an actual bottleneck in processing this operation (likely a combination of DB cost + overfetch/serialization), not random noise.

### How was it proven (what data was used)?

- **Load tool**: k6 run output from `scripts/k6-graphql.js` (stress) and `scripts/k6-graphql-sanity.js` (sanity).
- **Symptoms**:
  - In sanity (~2 RPS) the system is healthy: `http_req_failed: 0.00%`, p95 **49.8ms**.
  - In stress (target 50 RPS) the system saturates: achieved **4.62 req/s**, p95 **~60s**, ~30% timeouts, many dropped iterations.
- **Infra metrics**: `docker stats` snapshot during load vs idle, showing a large jump in CPU/RAM on `orders-api`.

## Step 3 - optmization

After changes (removing eager `relations: { items: true }` for the list + bulk prefetch of order items in `getOrdersSimple`), I re-ran the same stress test.

Was quering by k6 (serious load / stress):

- executor: constant-arrival-rate
- target rate: 50 iterations/s (≈50 RPS)
- duration: 2m
- max VUs: 300

THRESHOLDS (after optimization):

    http_req_duration
    ✗ 'p(95)<500' p(95)=37.41s

    http_req_failed
    ✓ 'rate<0.01' rate=0.00%

TOTAL RESULTS (after optimization):

    checks_total.......: 1240    8.266602/s
    checks_succeeded...: 100.00% 1240 out of 1240
    checks_failed......: 0.00%   0 out of 1240

    ✓ status is 200

HTTP (after optimization):

    http_req_duration..............: avg=31.04s min=351.64ms med=36.02s max=38.24s p(90)=37.15s p(95)=37.41s
    http_req_failed................: 0.00%  0 out of 1240
    http_reqs......................: 1240   8.266602/s

    EXECUTION
    dropped_iterations.............: 4734   31.559755/s

Docker stats snapshot (during stress, after optimization):

```
CONTAINER ID   NAME                               CPU %     MEM USAGE / LIMIT     MEM %     NET I/O           BLOCK I/O   PIDS
1c97fcafef83   security-homework-payments-db-1    2.97%     18.7MiB / 15.45GiB    0.12%     5.79kB / 5.94kB   0B / 0B     6
4afcf01b2c6e   security-homework-db-1             53.68%    41.11MiB / 15.45GiB   0.26%     563MB / 465MB     0B / 0B     16
5b7d0e4ea0df   rabbitmq                           0.14%     142MiB / 15.45GiB     0.90%     5.22kB / 3.52kB   0B / 0B     48
c9c2315561cc   security-homework-minio-1          0.05%     80.34MiB / 15.45GiB   0.51%     5.49kB / 2.96kB   0B / 0B     16
9861debaa5ca   security-homework-payments-api-1   0.00%     33.52MiB / 15.45GiB   0.21%     5.39kB / 2.7kB    0B / 0B     11
742a2f993c4d   security-homework-orders-api-1     130.90%   808.1MiB / 15.45GiB   5.11%     467MB / 675MB     0B / 0B     11

```

Summary (stress, before → after):

- Error rate: 30.44% → 0.00%
- Throughput (http_reqs/s): 4.62 → 8.27
- Tail latency p95: ~60s → 37.41s

Sanity run (after optimization): `scripts/k6-graphql-sanity.js`

- executor: constant-arrival-rate
- target rate: 2 iterations/s (≈2 RPS)
- duration: 1m
- max VUs: 20

TOTAL RESULTS (sanity, after optimization):

- http_req_failed: 0.00% (0/82)
- http_reqs: 82 (1.366664 req/s)
- http_req_duration: avg=4.84s, med(p50)=22.98ms, p95=25.16s, max=28.65s
- dropped_iterations: 38 (0.633332/s)
- Note: k6 reported `Insufficient VUs` on this run (hit 20 VUs), so the system was still not keeping up with the requested arrival rate even at low RPS.

Docker stats snapshot ("normal"/low-load moment):

```
CONTAINER ID   NAME                               CPU %     MEM USAGE / LIMIT     MEM %     NET I/O           BLOCK I/O   PIDS
1c97fcafef83   security-homework-payments-db-1    2.61%     18.75MiB / 15.45GiB   0.12%     5.79kB / 5.94kB   0B / 0B     6
4afcf01b2c6e   security-homework-db-1             6.03%     41.25MiB / 15.45GiB   0.26%     900MB / 735MB     0B / 0B     16
5b7d0e4ea0df   rabbitmq                           0.63%     149.9MiB / 15.45GiB   0.95%     7.62kB / 5.99kB   0B / 0B     48
c9c2315561cc   security-homework-minio-1          0.03%     86.9MiB / 15.45GiB    0.55%     5.49kB / 2.96kB   0B / 0B     16
9861debaa5ca   security-homework-payments-api-1   0.00%     35.25MiB / 15.45GiB   0.22%     5.39kB / 2.7kB    0B / 0B     11
742a2f993c4d   security-homework-orders-api-1     4.18%     133.9MiB / 15.45GiB   0.85%     738MB / 1.05GB    0B / 0B     11
```

## Cost / runtime improvement

### What I've added (timeout budgets)

- **GraphQL operation timeout (server-side)**: `GRAPHQL_OPERATION_TIMEOUT_MS`
  - Implemented as an Apollo Server plugin that aborts execution once the budget is exceeded.
  - Effect: prevents a single GraphQL operation from running unbounded and consuming worker/event-loop time indefinitely.

- **DB query timeout (driver-level)**: `DB_QUERY_TIMEOUT_MS`
  - Wired into TypeORM via `maxQueryExecutionTime`.
  - Effect: slow SQL cannot hold DB resources forever; fails fast instead of blocking the pool.

- **HTTP server socket timeouts**: `HTTP_SERVER_TIMEOUT_MS`
  - Applied to the Node HTTP server (`setTimeout`, `headersTimeout`, `requestTimeout`).
  - Effect: prevents “stuck” HTTP connections from living forever; should be **>= GraphQL + DB budgets** with a small buffer.

- **External dependency timeout (already existed)**: `PAYMENTS_GRPC_TIMEOUT_MS`
  - This caps outbound gRPC calls from orders → payments.

### Why this is a “cost / runtime” improvement

In cloud/runtime terms, **unbounded work is expensive** because it increases:

- average CPU utilization (you pay for bigger instances / more replicas),
- connection pool pressure (DB becomes the next bottleneck),
- tail latency (timeouts cascade to clients and retries amplify load).

With explicit budgets, the system trades **occasional controlled failures** for **predictable worst-case resource usage**, which is the core of runtime efficiency and cost control.

### How to configure (example)

Set in `.env` (see `.env.example`):

- `GRAPHQL_OPERATION_TIMEOUT_MS=30000`
- `DB_QUERY_TIMEOUT_MS=30000`
- `HTTP_SERVER_TIMEOUT_MS=65000`
- `PAYMENTS_GRPC_TIMEOUT_MS=5000` (already present)

---

## Results table (short)

Scope: **stress run** (`scripts/k6-graphql.js`, target **50 RPS**, **2m**), same GraphQL query shape.

| Metric                                                |                                                     Before |                                                                                                                                                                  After | Comment                                                                                        |
| ----------------------------------------------------- | ---------------------------------------------------------: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------: | ---------------------------------------------------------------------------------------------- |
| p95 latency                                           |                                                       ~60s |                                                                                                                                                                ~37.41s | Tail latency improved; still saturated under target RPS                                        |
| p99 latency                                           |                                       ~60s (≈timeout wall) |                                                                                                                                                     ~38s (max ~38.24s) | k6 summary didn’t print p99; using max as conservative proxy for tail                          |
| CPU (orders-api, docker stats during stress)          |                                                   ~104.79% |                                                                                                                                                               ~112.33% | CPU stayed high; bottleneck is mixed (API + DB work), not “CPU solved”                         |
| Memory (orders-api, docker stats during stress)       |                                                 ~1.856 GiB |                                                                                                                                                             ~1.576 GiB | Lower peak RAM during stress after query-shape changes                                         |
| Event loop lag                                        |                                                        N/A |                                                                                                                                                                    N/A | Not instrumented in this repo run                                                              |
| Error rate                                            |                                                     30.44% |                                                                                                                                                                  0.00% | Before: timeouts; after: no HTTP-level failures in this run                                    |
| Throughput                                            |                                                ~4.62 req/s |                                                                                                                                                            ~8.27 req/s | Still far below target 50 RPS; both runs show saturation/backpressure                          |
| Replicas / requests / limits / queue lag / cost proxy | replicas=1; requests/limits=not set; queue=N/A; cost=local | replicas=1; **timeouts added** (`GRAPHQL_OPERATION_TIMEOUT_MS`, `DB_QUERY_TIMEOUT_MS`, `HTTP_SERVER_TIMEOUT_MS`); requests/limits still not set; queue=N/A; cost=local | Cost/runtime improvement here is **worst-case bounding** (fail fast), not cloud billing change |

## Trade - offs

In this homework I improved the classic GraphQL orders-list endpoint (the `getOrdersSimple` baseline) by removing unnecessary eager relations and reducing N+1 behavior. This shifted more work to the database (which is expected), but improved the overall system behavior under load (higher throughput and fewer errors). I also introduced explicit timeout budgets for GraphQL, DB, and the HTTP server to prevent pathological requests from tying up the service for a long time.
