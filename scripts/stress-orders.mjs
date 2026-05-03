#!/usr/bin/env node
/**
 * Міні stress-тест orders-api у Docker: створює користувача, читає продукти,
 * відправляє валідні POST /api/orders з унікальними idempotency keys.
 *
 * Перед цим наповніть каталог:
 *   pnpm -C services/orders-service run db:bulk-products 200
 * або (після migrate):
 *   docker compose --profile tools run --rm bulk-seed-products
 *
 * Запуск (stack уже піднятий: docker compose up):
 *   node scripts/stress-orders.mjs
 *
 * Змінні середовища:
 *   BASE_URL   — за замовчуванням http://127.0.0.1:8080 (мапа compose: PORT->3000)
 *   ROUNDS     — скільки ордерів створити (default 80)
 *   CONCURRENCY — паралельних запитів (default 8)
 *   MIN_QTY, MAX_QTY — кількість одиниці товару в рядку (default 1–3)
 */

const BASE_URL = (process.env.BASE_URL ?? 'http://127.0.0.1:8080').replace(
  /\/$/,
  '',
);
const ROUNDS = Math.max(1, parseInt(process.env.ROUNDS ?? '80', 10) || 80);
const CONCURRENCY = Math.max(
  1,
  parseInt(process.env.CONCURRENCY ?? '8', 10) || 8,
);
const MIN_QTY = Math.max(1, parseInt(process.env.MIN_QTY ?? '1', 10) || 1);
const MAX_QTY = Math.max(
  MIN_QTY,
  parseInt(process.env.MAX_QTY ?? '3', 10) || 3,
);

function randomUuid() {
  return crypto.randomUUID();
}

function randInt(a, b) {
  return a + Math.floor(Math.random() * (b - a + 1));
}

async function jsonFetch(path, options = {}) {
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
  if (!res.ok) {
    const err = new Error(
      `${options.method ?? 'GET'} ${path} -> ${res.status}`,
    );
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return body;
}

async function createStressUser() {
  const id = randomUuid().slice(0, 8);
  // Домен на кшталт stress.local часто відсікає @IsEmail(); example.com — завжди ок
  const email = `stress-${id}@example.com`;
  const user = await jsonFetch('/api/v2/user', {
    method: 'POST',
    body: JSON.stringify({
      email,
      profile: {
        firstName: 'Stress',
        lastName: 'Runner',
        preferredLanguage: 'uk',
      },
      password: 'StressRunner1',
    }),
  });
  if (!user?.id) {
    throw new Error('POST /api/v2/user did not return id');
  }
  return { id: user.id, email };
}

async function loadProducts() {
  const list = await jsonFetch('/api/products/top?minPrice=0&limit=500');
  if (!Array.isArray(list) || list.length === 0) {
    throw new Error(
      'No products returned. Run bulk-seed-products first, then retry.',
    );
  }
  return list;
}

function buildItems(products) {
  const nLines = randInt(1, 3);
  const used = new Set();
  const items = [];
  for (let i = 0; i < nLines; i++) {
    let p = products[randInt(0, products.length - 1)];
    let guard = 0;
    while (used.has(p.id) && guard++ < 20) {
      p = products[randInt(0, products.length - 1)];
    }
    used.add(p.id);
    items.push({
      productId: p.id,
      quantity: randInt(MIN_QTY, MAX_QTY),
    });
  }
  return items;
}

async function createOrder(userId, products) {
  const body = {
    idempotencyKey: randomUuid(),
    userId,
    items: buildItems(products),
  };
  return jsonFetch('/api/orders', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

async function pool(jobs, concurrency) {
  let i = 0;
  const results = [];
  async function worker() {
    while (i < jobs.length) {
      const idx = i++;
      results[idx] = await jobs[idx]();
    }
  }
  const workers = Array.from(
    { length: Math.min(concurrency, jobs.length) },
    () => worker(),
  );
  await Promise.all(workers);
  return results;
}

async function main() {
  console.log(`Target: ${BASE_URL}`);
  console.log(`ROUNDS=${ROUNDS} CONCURRENCY=${CONCURRENCY}`);

  const user = await createStressUser();
  console.log(`User: ${user.email} (${user.id})`);

  const products = await loadProducts();
  console.log(`Products loaded: ${products.length}`);

  const jobs = Array.from({ length: ROUNDS }, (_, k) => async () => {
    try {
      const order = await createOrder(user.id, products);
      return { ok: true, k, orderId: order?.id };
    } catch (e) {
      return {
        ok: false,
        k,
        status: e.status,
        message: e.message,
        body: e.body,
      };
    }
  });

  const started = Date.now();
  const out = await pool(jobs, CONCURRENCY);
  const ms = Date.now() - started;

  const ok = out.filter((r) => r.ok).length;
  const fail = out.filter((r) => !r.ok);
  console.log(`Finished in ${ms}ms: ${ok}/${ROUNDS} ok`);
  if (fail.length) {
    console.log('Sample failures (up to 5):');
    for (const f of fail.slice(0, 5)) {
      console.log(' ', f.status ?? '', f.body ?? f.message);
    }
    if (fail.length > 5) console.log(`  ... and ${fail.length - 5} more`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
