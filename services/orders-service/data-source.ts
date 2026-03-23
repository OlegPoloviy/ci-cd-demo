import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';

// Explicitly load root .env (one level above apps/)
config({ path: join(__dirname, '../../.env') });

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5433'),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: ['src/**/*.entity{.ts,.js}'],
  migrations: ['src/common/migrations/*{.ts,.js}'],
  synchronize: false,
});
