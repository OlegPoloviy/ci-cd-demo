import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderTrackingEntity } from './order-tracking.entity';
import { OrderTrackingEventsService } from './order-tracking-events.service';
import { OrderTrackingService } from './order-tracking.service';

@Module({
  imports: [TypeOrmModule.forFeature([OrderTrackingEntity])],
  providers: [OrderTrackingService, OrderTrackingEventsService],
  exports: [OrderTrackingService, OrderTrackingEventsService],
})
export class OrderTrackingModule {}
