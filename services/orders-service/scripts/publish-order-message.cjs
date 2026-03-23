/**
 * Publish one message to orders.process (for testing idempotency — run twice with same MESSAGE_ID).
 * Usage: ORDER_ID=<uuid> MESSAGE_ID=<uuid> node scripts/publish-order-message.cjs
 * RABBITMQ_URL defaults to amqp://guest:guest@localhost:5672 when run on host.
 */
const amqp = require('amqplib');

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
const ORDER_ID = process.env.ORDER_ID;
const MESSAGE_ID = process.env.MESSAGE_ID || require('crypto').randomUUID();

if (!ORDER_ID) {
  console.error('Set ORDER_ID (UUID of an existing order). Example: ORDER_ID=... MESSAGE_ID=... node scripts/publish-order-message.cjs');
  process.exit(1);
}

const payload = {
  messageId: MESSAGE_ID,
  orderId: ORDER_ID,
  attempt: 0,
  items: [],
};

async function main() {
  const conn = await amqp.connect(RABBITMQ_URL);
  const ch = await conn.createChannel();
  await ch.assertQueue('orders.process', { durable: true });
  ch.sendToQueue('orders.process', Buffer.from(JSON.stringify(payload)), {
    persistent: true,
    contentType: 'application/json',
  });
  console.log('Published to orders.process:', JSON.stringify(payload, null, 2));
  await ch.close();
  await conn.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
