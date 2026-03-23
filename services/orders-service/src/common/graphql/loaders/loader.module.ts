import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../../../modules/user/user.entity';
import { Product } from '../../../modules/products/products.entity';
import { OrderItemEntity } from '../../../modules/orders/order-item.entity';
import { DataLoaderFactory } from './data-loader';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, Product, OrderItemEntity])],
  providers: [DataLoaderFactory],
  exports: [DataLoaderFactory]
})
export class LoadersModule {}

