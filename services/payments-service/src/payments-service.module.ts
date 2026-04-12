import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
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
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.getOrThrow<string>('PAYMENTS_DB_HOST'),
        port: Number(configService.getOrThrow<string>('PAYMENTS_DB_PORT')),
        username: configService.getOrThrow<string>('PAYMENTS_DB_USER'),
        password: configService.getOrThrow<string>('PAYMENTS_DB_PASSWORD'),
        database: configService.getOrThrow<string>('PAYMENTS_DB_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
      }),
    }),
    TypeOrmModule.forFeature([PaymentsEntity]),
  ],
  controllers: [PaymentsGRPCController],
  providers: [PaymentsServiceService],
})
export class PaymentsServiceModule {}
