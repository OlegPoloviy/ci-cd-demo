import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    baseline: {
      executor: 'constant-arrival-rate',
      rate: 50, // 50 RPS (потім зробиш 100/200)
      timeUnit: '1s',
      duration: '2m',
      preAllocatedVUs: 50,
      maxVUs: 300,
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'], // error rate < 1%
    http_req_duration: ['p(95)<500'],
  },
};

export default function () {
  const url = 'http://localhost:8080/graphql';
  const body = JSON.stringify({
    query: `
        query AdminOrders($pagination: OrderPaginationInput, $filter: OrderFilterInput) {
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
    variables: { pagination: { page: 1, limit: 100 }, filter: {} },
  });
  const res = http.post(url, body, {
    headers: {
      'Content-Type': 'application/json',
      'apollo-require-preflight': 'true',
    },
  });
  check(res, { 'status is 200': (r) => r.status === 200 });
  sleep(0.1);
}
