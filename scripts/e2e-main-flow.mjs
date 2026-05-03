import { randomUUID } from 'node:crypto';

const baseUrl = process.env.BASE_URL ?? 'http://localhost:18080';
const email = `main-flow-${Date.now()}-${randomUUID().slice(0, 8)}@example.com`;
const password = `Pass-${randomUUID()}`;
const pollAttempts = Number(process.env.E2E_POLL_ATTEMPTS ?? 30);
const pollDelayMs = Number(process.env.E2E_POLL_DELAY_MS ?? 1000);

function url(path) {
  return new URL(path, baseUrl).toString();
}

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function request(path, options = {}) {
  const response = await fetch(url(path), {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });

  const text = await response.text();
  const body = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(
      `${options.method ?? 'GET'} ${path} failed with ${response.status}: ${text}`,
    );
  }

  return body;
}

async function waitForHealth() {
  for (let attempt = 1; attempt <= 30; attempt += 1) {
    try {
      const health = await request('/health');
      if (health?.status === 'ok') return;
    } catch {
      // keep polling
    }

    await sleep(1000);
  }

  throw new Error(`Service did not become healthy at ${baseUrl}`);
}

async function main() {
  console.log(`Running main-flow e2e against ${baseUrl}`);
  await waitForHealth();

  const user = await request('/api/v2/user', {
    method: 'POST',
    body: JSON.stringify({
      email,
      password,
      name: 'Main Flow E2E User',
    }),
  });

  const login = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  const accessToken = login?.accessToken;
  if (!accessToken) {
    throw new Error('Login response did not include accessToken');
  }

  const products = await request('/api/products/top?minPrice=0&limit=1');
  const product = products?.[0];
  if (!product?.id) {
    throw new Error('No seeded product found for order e2e scenario');
  }

  const createdOrder = await request('/api/orders', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({
      idempotencyKey: randomUUID(),
      userId: user.id,
      items: [{ productId: product.id, quantity: 1 }],
    }),
  });

  if (createdOrder.status !== 'PENDING') {
    throw new Error(`Expected created order status PENDING, got ${createdOrder.status}`);
  }

  let finalOrder = createdOrder;
  for (let attempt = 1; attempt <= pollAttempts; attempt += 1) {
    finalOrder = await request(`/api/orders/${createdOrder.id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (finalOrder.status === 'PROCESSED') break;
    await sleep(pollDelayMs);
  }

  if (finalOrder.status !== 'PROCESSED') {
    throw new Error(
      `Order ${createdOrder.id} was not processed after ${pollAttempts} attempts; latest status=${finalOrder.status}`,
    );
  }

  const paymentStatus = await request(`/api/orders/${createdOrder.id}/payment-status`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!paymentStatus?.paymentId || !paymentStatus?.paymentStatus) {
    throw new Error(`Payment status response is incomplete: ${JSON.stringify(paymentStatus)}`);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        userId: user.id,
        orderId: createdOrder.id,
        finalStatus: finalOrder.status,
        paymentStatus: paymentStatus.paymentStatus,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
