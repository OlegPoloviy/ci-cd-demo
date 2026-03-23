import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { OrdersEntity } from './orders.entity';
import { Product } from '../products/products.entity';

@Entity('order-item')
export class OrderItemEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'order_id' })
  orderId: string;

  @ManyToOne(() => OrdersEntity, (order) => order.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'order_id' })
  order: OrdersEntity;

  @Column({ type: 'uuid', name: 'product_id' })
  productId: string;
  @ManyToOne(() => Product, (product) => product.orderItems, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ type: 'int' })
  quantity: number;

  @Column('numeric', {
    precision: 12,
    scale: 2,
    name: 'price_at_purchase',
    transformer: {
      to: (value) => value,
      from: (value) => parseFloat(value),
    },
  })
  priceAtPurchase: string;
}
