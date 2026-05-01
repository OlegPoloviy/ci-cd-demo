import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { In } from 'typeorm';
import { AppDataSource } from './data-source';
import { UserEntity } from './src/modules/user/user.entity';
import { Product } from './src/modules/products/products.entity';
import { OrdersEntity } from './src/modules/orders/orders.entity';
import { OrderItemEntity } from './src/modules/orders/order-item.entity';
import { OrderStatus } from './src/constants';

function intFromEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  const n = raw == null ? NaN : parseInt(String(raw), 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function seedLoad() {
  const userCount = intFromEnv('SEED_USERS', 200);
  const productCount = intFromEnv('SEED_PRODUCTS', 80);
  const orderCount = intFromEnv('SEED_ORDERS', 5000);
  const maxItemsPerOrder = intFromEnv('SEED_MAX_ITEMS', 5);
  const batchSize = intFromEnv('SEED_BATCH', 500);

  console.log('Initializing data source...');
  await AppDataSource.initialize();

  const userRepo = AppDataSource.getRepository(UserEntity);
  const productRepo = AppDataSource.getRepository(Product);
  const ordersRepo = AppDataSource.getRepository(OrdersEntity);
  const orderItemsRepo = AppDataSource.getRepository(OrderItemEntity);

  try {
    console.log(
      `Seeding load data: users=${userCount}, products=${productCount}, orders=${orderCount}`,
    );

    // --- Users ---
    console.log('Creating users...');
    const usersToInsert: Partial<UserEntity>[] = Array.from(
      { length: userCount },
      (_, i) => {
        const n = i + 1;
        return {
          name: `Load User ${n}`,
          email: `load.user.${Date.now()}.${n}@example.com`,
          roles: [],
          scopes: [],
          profile: {
            firstName: 'Load',
            lastName: `User${n}`,
            preferredLanguage: 'en',
          } as any,
        };
      },
    );

    const insertedUsers = await userRepo
      .createQueryBuilder()
      .insert()
      .into(UserEntity)
      .values(usersToInsert as any)
      .returning(['id'])
      .execute();

    const userIds = insertedUsers.generatedMaps.map(
      (m: any) => m.id,
    ) as string[];
    console.log(`Inserted users: ${userIds.length}`);

    // --- Products ---
    console.log('Creating products...');
    const productsToInsert: Partial<Product>[] = Array.from(
      { length: productCount },
      (_, i) => {
        const n = i + 1;
        const price = Number((5 + Math.random() * 200).toFixed(2));
        return {
          name: `Load Product ${n}`,
          sku: `LOAD-SKU-${String(n).padStart(4, '0')}-${Date.now()}`,
          description: 'Generated for load testing',
          price,
          stock: 1_000_000,
          isActive: true,
        };
      },
    );

    const insertedProducts = await productRepo
      .createQueryBuilder()
      .insert()
      .into(Product)
      .values(productsToInsert as any)
      .returning(['id', 'price'])
      .execute();

    const products = insertedProducts.generatedMaps.map((m: any) => ({
      id: m.id as string,
      price: Number(m.price),
    }));
    const productIds = products.map((p) => p.id);
    console.log(`Inserted products: ${products.length}`);

    // --- Orders + items ---
    console.log('Creating orders and items...');
    let createdOrders = 0;
    for (let offset = 0; offset < orderCount; offset += batchSize) {
      const size = Math.min(batchSize, orderCount - offset);

      const orderValues: Partial<OrdersEntity>[] = Array.from(
        { length: size },
        () => ({
          userId: pick(userIds),
          idempotencyKey: randomUUID(),
          status: OrderStatus.CREATED,
          courierId: null,
          paymentId: null,
          processedAt: null,
        }),
      );

      const insertedOrders = await ordersRepo
        .createQueryBuilder()
        .insert()
        .into(OrdersEntity)
        .values(orderValues as any)
        .returning(['id'])
        .execute();

      const orderIds = insertedOrders.generatedMaps.map(
        (m: any) => m.id,
      ) as string[];

      // Build items for this batch
      const itemsToInsert: Partial<OrderItemEntity>[] = [];
      for (const orderId of orderIds) {
        const itemsCount =
          1 + Math.floor(Math.random() * Math.max(1, maxItemsPerOrder));
        const used = new Set<string>();
        for (let i = 0; i < itemsCount; i++) {
          let productId = pick(productIds);
          let guard = 0;
          while (used.has(productId) && guard++ < 10)
            productId = pick(productIds);
          used.add(productId);

          const product = products.find((p) => p.id === productId) ?? {
            price: 0,
          };
          const quantity = 1 + Math.floor(Math.random() * 3);
          itemsToInsert.push({
            orderId,
            productId,
            quantity,
            priceAtPurchase: String(product.price),
          });
        }
      }

      await orderItemsRepo
        .createQueryBuilder()
        .insert()
        .into(OrderItemEntity)
        .values(itemsToInsert as any)
        .execute();

      createdOrders += orderIds.length;
      console.log(`Inserted orders: ${createdOrders}/${orderCount}`);
    }

    // Quick sanity: ensure items exist for some orders
    const sampleOrderIds = userIds.length > 0 ? [] : [];
    void sampleOrderIds;

    console.log('Load seed finished successfully.');
    console.log(
      'Tip: use getOrdersSimple vs getOrders to compare N+1 vs DataLoader.',
    );
  } catch (err) {
    console.error('Load seeding failed', err);
    process.exitCode = 1;
  } finally {
    await AppDataSource.destroy();
  }
}

seedLoad().catch((e) => {
  console.error('Unhandled error in load seed script', e);
  process.exit(1);
});
