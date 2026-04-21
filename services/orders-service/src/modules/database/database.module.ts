import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmRequestContextLogger } from './db-logger';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const raw = configService.get<string | number>('DB_QUERY_TIMEOUT_MS');
        const parsed =
          typeof raw === 'number' ? raw : parseInt(String(raw ?? ''), 10);
        const maxQueryExecutionTime =
          Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;

        return {
          type: 'postgres' as const,
          host: configService.get<string>('DB_HOST'),
          port: configService.get<number>('DB_PORT'),
          username: configService.get<string>('DB_USER'),
          password: configService.get<string>('DB_PASSWORD'),
          database: configService.get<string>('DB_NAME'),
          autoLoadEntities: true,
          synchronize: false,
          logging: true,
          logger: new TypeOrmRequestContextLogger(),
          ...(maxQueryExecutionTime ? { maxQueryExecutionTime } : {}),
        };
      },
    }),
  ],
})
export class DatabaseModule {}
