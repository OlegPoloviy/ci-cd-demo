import 'dotenv/config';
import { AppDataSource } from './data-source';
import { UserEntity } from './src/modules/user/user.entity';
import { Product } from './src/modules/products/products.entity';
import { OrdersEntity } from './src/modules/orders/orders.entity';
import { OrderItemEntity } from './src/modules/orders/order-item.entity';
import { OrderStatus } from './src/constants';
import { v5 as uuidv5 } from 'uuid';

async function seed() {
  console.log('Initializing data source...');
  await AppDataSource.initialize();

  const userRepo = AppDataSource.getRepository(UserEntity);
  const productRepo = AppDataSource.getRepository(Product);
  const ordersRepo = AppDataSource.getRepository(OrdersEntity);
  const orderItemsRepo = AppDataSource.getRepository(OrderItemEntity);

  const SEED_NS = 'e9d88702-2dbb-46ca-9b6c-555232ddc9a9';

  const users = [
    {
      name: 'Alice Admin',
      email: 'alice.admin@example.com',
      roles: ['admin', 'courier'],
      scopes: ['*'],
      profile: {
        firstName: 'Alice',
        lastName: 'Admin',
        preferredLanguage: 'en',
      },
    },
    {
      name: 'Bob Buyer',
      email: 'bob.buyer@example.com',
      roles: ['buyer'],
      scopes: [],
      profile: { firstName: 'Bob', lastName: 'Buyer', preferredLanguage: 'en' },
    },
  ];

  const products = [
    {
      name: 'Plain T-Shirt',
      sku: 'TSHIRT-PLAIN-001',
      description: 'Comfortable plain t-shirt',
      price: 19.99,
      stock: 100,
      isActive: true,
    },
    {
      name: 'Blue Jeans',
      sku: 'JEANS-BLUE-001',
      description: 'Classic blue jeans',
      price: 49.99,
      stock: 50,
      isActive: true,
    },
    {
      name: 'Sneakers',
      sku: 'SNEAK-001',
      description: 'Stylish sneakers',
      price: 79.99,
      stock: 25,
      isActive: true,
    },
  ];

  try {
    console.log('Seeding users...');
    for (const u of users) {
      const existing = await userRepo.findOne({ where: { email: u.email } });
      if (existing) {
        console.log(`User ${u.email} already exists, skipping`);
        continue;
      }

      const saved = await userRepo.save(u as any);
      console.log(`Inserted user ${saved.email} (id=${saved.id})`);
    }

    console.log('Seeding products...');
    for (const p of products) {
      const existing = await productRepo.findOne({ where: { sku: p.sku } });
      if (existing) {
        console.log(`Product ${p.sku} already exists, skipping`);
        continue;
      }

      const saved = await productRepo.save(p as any);
      console.log(`Inserted product ${saved.sku} (id=${saved.id})`);
    }

    console.log('Seeding orders...');
    const alice = await userRepo.findOneOrFail({
      where: { email: 'alice.admin@example.com' },
    });
    const bob = await userRepo.findOneOrFail({
      where: { email: 'bob.buyer@example.com' },
    });

    const tshirt = await productRepo.findOneOrFail({
      where: { sku: 'TSHIRT-PLAIN-001' },
    });
    const jeans = await productRepo.findOneOrFail({
      where: { sku: 'JEANS-BLUE-001' },
    });
    const sneakers = await productRepo.findOneOrFail({
      where: { sku: 'SNEAK-001' },
    });

    const seedOrders: Array<{
      key: string;
      userId: string;
      status: OrderStatus;
      courierId?: string | null;
      processedAt?: Date | null;
      items: Array<{ productId: string; quantity: number; price: number }>;
    }> = [
      {
        key: 'order-1-created',
        userId: bob.id,
        status: OrderStatus.CREATED,
        items: [
          { productId: tshirt.id, quantity: 2, price: tshirt.price },
          { productId: jeans.id, quantity: 1, price: jeans.price },
        ],
      },
      {
        key: 'order-2-paid',
        userId: bob.id,
        status: OrderStatus.PAID,
        items: [{ productId: sneakers.id, quantity: 1, price: sneakers.price }],
      },
      {
        key: 'order-3-processed',
        userId: bob.id,
        status: OrderStatus.PROCESSED,
        courierId: alice.id,
        processedAt: new Date(),
        items: [
          { productId: tshirt.id, quantity: 1, price: tshirt.price },
          { productId: sneakers.id, quantity: 2, price: sneakers.price },
        ],
      },
    ];

    for (const so of seedOrders) {
      const idempotencyKey = uuidv5(`seed:${so.key}`, SEED_NS);
      const existing = await ordersRepo.findOne({ where: { idempotencyKey } });
      if (existing) {
        console.log(`Order ${so.key} already exists, skipping`);
        continue;
      }

      await AppDataSource.transaction(async (manager) => {
        const order = await manager.getRepository(OrdersEntity).save({
          userId: so.userId,
          status: so.status,
          courierId: so.courierId ?? null,
          idempotencyKey,
          paymentId: null,
          processedAt: so.processedAt ?? null,
        });

        await manager.getRepository(OrderItemEntity).save(
          so.items.map((i) => ({
            orderId: order.id,
            productId: i.productId,
            quantity: i.quantity,
            priceAtPurchase: i.price.toFixed(2),
          })),
        );

        console.log(
          `Inserted order ${so.key} (id=${order.id}, status=${order.status})`,
        );
      });
    }

    console.log('Seeding finished successfully');
  } catch (err) {
    console.error('Seeding failed', err);
    process.exitCode = 1;
  } finally {
    await AppDataSource.destroy();
  }
}

seed().catch((e) => {
  console.error('Unhandled error in seed script', e);
  process.exit(1);
});
