import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import { PaymentsGRPCController } from './payments-service.controller';
import { PaymentsServiceService } from './payments-service.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsEntity } from './entities/payments.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [join(process.cwd(), '../../.env')],
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.PAYMENTS_DB_HOST || 'localhost',
      port: Number(process.env.PAYMENTS_DB_PORT) || 5434,
      username: process.env.PAYMENTS_DB_USER || 'postgres',
      password: process.env.PAYMENTS_DB_PASSWORD || 'postgres',
      database: process.env.PAYMENTS_DB_NAME || 'payments',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
    }),
    TypeOrmModule.forFeature([PaymentsEntity]),
  ],
  controllers: [PaymentsGRPCController],
  providers: [PaymentsServiceService],
})
export class PaymentsServiceModule {}
