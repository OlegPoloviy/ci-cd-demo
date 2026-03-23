import * as DataLoader from 'dataloader';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '../../../modules/user/user.entity';
import { Product } from '../../../modules/products/products.entity';
import { OrderItemEntity } from '../../../modules/orders/order-item.entity';
import { Repository, In } from 'typeorm';
import { Injectable } from '@nestjs/common';

@Injectable()
export class DataLoaderFactory {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    @InjectRepository(OrderItemEntity)
    private readonly orderItemsRepository: Repository<OrderItemEntity>
  ) {}
   
  createLoader() {
    return {
        userLoader: new DataLoader(async (ids: readonly string[]) => {
            if (ids.length === 0) return [];

            const users = await this.usersRepository.find({ where: { id: In([...ids]) } });
            const usersById = new Map(users.map((user) => [user.id, user]));
            
            return ids.map((id) => usersById.get(id) ?? null);
        }),

        productLoader: new DataLoader(async (ids: readonly string[]) => {
            if (ids.length === 0) return [];

            const products = await this.productsRepository.find({ where: { id: In([...ids]) } });
            const productsById = new Map(products.map((product) => [product.id, product]));
            
            return ids.map((id) => productsById.get(id) ?? null);
        }),

        orderItemsLoader: new DataLoader(async (orderIds: readonly string[]) => {
            if (orderIds.length === 0) return [];

            const orderItems = await this.orderItemsRepository.find({ 
                where: { orderId: In([...orderIds]) } 
            });

            const itemsByOrderId = new Map<string, OrderItemEntity[]>();
            
            orderIds.forEach(id => itemsByOrderId.set(id, [])); 

            orderItems.forEach(item => {
                itemsByOrderId.get(item.orderId)?.push(item);
            });

            return orderIds.map((id) => itemsByOrderId.get(id) || []);
        }),
    } 
  }
}