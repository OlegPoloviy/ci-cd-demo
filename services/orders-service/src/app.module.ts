import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { HealthController } from './health.controller';
import { AppService } from './app.service';
import { UserModule } from './modules/user/user.module';
import { RequestIdMiddleware } from './common/middlewares/request-id.middleware';
import { RequestContextMiddleware } from './common/middlewares/request-context.middleware';
import { DatabaseModule } from './modules/database/database.module';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import { OrdersModule } from './modules/orders/orders.module';
import { ProductsModule } from './modules/products/products.module';
import { AppGraphqlModule } from './modules/appgraphql/appgraphql.module';
import { AuthModule } from './modules/auth/auth.module';
import { FilesModule } from './modules/files/files.module';
import { FilesController } from './modules/files/files.controller';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { OrderTrackingModule } from './modules/order-tracking/order-tracking.module';
import { RabbitmqModule } from './modules/rabbitmq/rabbitmq.module';

@Module({
  imports: [
    UserModule,
    DatabaseModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: join(process.cwd(), '../../.env'),
    }),
    OrdersModule,
    ProductsModule,
    AppGraphqlModule,
    AuthModule,
    FilesModule,
    RealtimeModule,
    OrderTrackingModule,
    RabbitmqModule,
  ],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule {
  // configure(consumer: MiddlewareConsumer) {
  //   consumer.apply(RequestMiddleware).forRoutes('*');
  // }
}
