#!/usr/bin/env node
/**
 * Послідовно опитує GET /api/orders/:id/payment-status для усіх ордерів
 * (із пагінацією списку), з паузою між запитами статусу — щоб не штовхати API «разом».
 *
 * Потрібен піднятий stack і спільний BASE_URL з іншими скриптами.
 *
 *   pnpm run poll:payment-status
 *
 * Змінні середовища:
 *   BASE_URL     — default http://127.0.0.1:8080
 *   DELAY_MS     — пауза після кожного успішного/неуспішного GET payment-status (default 300)
 *   PAGE_SIZE    — скільки ордерів на сторінку при GET /api/orders (default 100)
 *   START_DELAY_MS — пауза перед першим payment-status (default 0)
 */

const BASE_URL = (process.env.BASE_URL ?? 'http://127.0.0.1:8080').replace(
  /\/$/,
  '',
);
const DELAY_MS = Math.max(
  0,
  parseInt(process.env.DELAY_MS ?? '300', 10) || 300,
);
const PAGE_SIZE = Math.min(
  10_000,
  Math.max(1, parseInt(process.env.PAGE_SIZE ?? '100', 10) || 100),
);
const START_DELAY_MS = Math.max(
  0,
  parseInt(process.env.START_DELAY_MS ?? '0', 10) || 0,
);

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchJson(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { ok: res.ok, status: res.status, body };
}

async function fetchAllOrders() {
  const all = [];
  let page = 1;
  while (true) {
    const { ok, status, body } = await fetchJson(
      `/api/orders?page=${page}&limit=${PAGE_SIZE}`,
    );
    if (!ok) {
      throw new Error(
        `GET /api/orders failed: ${status} ${JSON.stringify(body)}`,
      );
    }
    const items = body?.items;
    const total = body?.total;
    if (!Array.isArray(items)) {
      throw new Error(
        'Unexpected /api/orders shape: expected { items, total }',
      );
    }
    all.push(...items);
    if (typeof total === 'number' && all.length >= total) break;
    if (items.length < PAGE_SIZE) break;
    page += 1;
  }
  return all;
}

async function main() {
  console.log(`Target: ${BASE_URL}`);
  console.log(
    `DELAY_MS=${DELAY_MS} PAGE_SIZE=${PAGE_SIZE} START_DELAY_MS=${START_DELAY_MS}`,
  );

  const orders = await fetchAllOrders();
  console.log(`Orders loaded: ${orders.length}`);

  const withPayment = orders.filter((o) => o.paymentId);
  const withoutPayment = orders.length - withPayment.length;
  console.log(
    `With paymentId: ${withPayment.length}, without (will skip): ${withoutPayment}`,
  );

  const stats = {
    ok: 0,
    err: 0,
    byStatus: {},
  };

  if (START_DELAY_MS) await sleep(START_DELAY_MS);

  for (let i = 0; i < withPayment.length; i++) {
    const o = withPayment[i];
    const { ok, status, body } = await fetchJson(
      `/api/orders/${o.id}/payment-status`,
    );
    if (ok) {
      stats.ok += 1;
    } else {
      stats.err += 1;
      stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
    }

    const prefix = `[${i + 1}/${withPayment.length}] order=${o.id}`;
    if (ok) {
      console.log(`${prefix} ->`, JSON.stringify(body));
    } else {
      console.warn(`${prefix} -> HTTP ${status}`, body?.error ?? body);
    }

    if (i < withPayment.length - 1 && DELAY_MS > 0) {
      await sleep(DELAY_MS);
    }
  }

  console.log('---');
  console.log(
    `Done. payment-status OK: ${stats.ok}, errors: ${stats.err}`,
    stats.err ? JSON.stringify(stats.byStatus) : '',
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
