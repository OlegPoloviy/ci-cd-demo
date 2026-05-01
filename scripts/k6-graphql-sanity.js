import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    sanity: {
      executor: 'constant-arrival-rate',
      rate: 2, // ~2 RPS
      timeUnit: '1s',
      duration: '1m',
      preAllocatedVUs: 2,
      maxVUs: 20,
      gracefulStop: '10s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<2000'],
  },
};

export default function () {
  const url = 'http://localhost:8080/graphql';
  const body = JSON.stringify({
    query: `
      query AdminOrdersSanity($pagination: OrderPaginationInput, $filter: OrderFilterInput) {
        getOrdersSimple(pagination: $pagination, ordersFilter: $filter) {
          total
          items {
            id
            createdAt
            status
            user { id email }
            items {
              id
              quantity
              priceAtPurchase
              product { id sku name price }
            }
          }
        }
      }`,
    variables: { pagination: { page: 1, limit: 20 }, filter: {} },
  });

  const res = http.post(url, body, {
    headers: {
      'Content-Type': 'application/json',
      'apollo-require-preflight': 'true',
    },
    timeout: '30s',
  });

  check(res, { 'status is 200': (r) => r.status === 200 });
  sleep(0.1);
}
