import { Module } from '@nestjs/common';
import { join } from 'path';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderItemEntity } from './order-item.entity';
import { Product } from '../products/products.entity';
import { UserEntity } from '../user/user.entity';
import { OrdersEntity } from './orders.entity';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { OrderResolver } from './graphql/order.resolver';
import { UserService } from '../user/user.service';
import { UserModule } from '../user/user.module';
import { OrderItemResolver } from './graphql/order-item.resolver';
import { ProductsModule } from '../products/products.module';
import { OrderTrackingModule } from '../order-tracking/order-tracking.module';
import { RabbitmqModule } from '../rabbitmq/rabbitmq.module';
import { OrdersProcessorService } from './orders-processor.service';
import { ProcessedMessagesEntity } from './processed-message.entity';
import { ClientsModule } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Transport } from '@nestjs/microservices';

@Module({
  imports: [
    OrderTrackingModule,
    RabbitmqModule,
    TypeOrmModule.forFeature([
      OrderItemEntity,
      OrdersEntity,
      Product,
      Product,
      UserEntity,
      ProcessedMessagesEntity,
    ]),
    ClientsModule.registerAsync([
      {
        name: 'PAYMENTS_GRPC_CLIENT',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            package: 'payments.v1',
            protoPath: join(
              process.cwd(),
              '../../contracts/proto/payments.proto',
            ),
            url: config.get<string>('PAYMENTS_GRPC_URL', 'localhost:50051'),
          },
        }),
      },
    ]),
    UserModule,
    ProductsModule,
  ],
  providers: [
    OrdersService,
    OrdersProcessorService,
    OrderResolver,
    OrderItemResolver,
  ],
  controllers: [OrdersController],
  exports: [OrdersService],
})
export class OrdersModule {}
