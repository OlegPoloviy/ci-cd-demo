import 'dotenv/config';
import { AppDataSource } from './data-source';
import { UserEntity } from './src/modules/user/user.entity';
import { Product } from './src/modules/products/products.entity';

async function seed() {
  console.log('Initializing data source...');
  await AppDataSource.initialize();

  const userRepo = AppDataSource.getRepository(UserEntity);
  const productRepo = AppDataSource.getRepository(Product);

  const users = [
    {
      name: 'Alice Admin',
      email: 'alice.admin@example.com',
      profile: {
        firstName: 'Alice',
        lastName: 'Admin',
        preferredLanguage: 'en',
      },
    },
    {
      name: 'Bob Buyer',
      email: 'bob.buyer@example.com',
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
    },
    {
      name: 'Blue Jeans',
      sku: 'JEANS-BLUE-001',
      description: 'Classic blue jeans',
      price: 49.99,
      stock: 50,
    },
    {
      name: 'Sneakers',
      sku: 'SNEAK-001',
      description: 'Stylish sneakers',
      price: 79.99,
      stock: 25,
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
