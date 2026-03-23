import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { OrderTrackingModule } from '../order-tracking/order-tracking.module';
import { OrdersModule } from '../orders/orders.module';
import { DeliveryGateway } from './delivery.gateway';

@Module({
  imports: [AuthModule, OrderTrackingModule, OrdersModule],
  providers: [DeliveryGateway],
})
export class RealtimeModule {}
