import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';

// Explicitly load root .env (one level above apps/)
config({ path: join(__dirname, '../../.env') });

export const PaymentsDataSource = new DataSource({
  type: 'postgres',
  host: process.env.PAYMENTS_DB_HOST,
  port: parseInt(process.env.PAYMENTS_DB_PORT ?? '5434', 10),
  username: process.env.PAYMENTS_DB_USER,
  password: process.env.PAYMENTS_DB_PASSWORD,
  database: process.env.PAYMENTS_DB_NAME,
  entities: ['src/**/*.entity{.ts,.js}'],
  migrations: ['src/migrations/*{.ts,.js}'],
  synchronize: false,
});
