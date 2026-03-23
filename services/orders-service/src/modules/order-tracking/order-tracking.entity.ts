import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryColumn,
} from 'typeorm';
import { OrdersEntity } from '../orders/orders.entity';
import { UserEntity } from '../user/user.entity';

@Entity('order_tracking')
export class OrderTrackingEntity {
  @PrimaryColumn({ type: 'uuid', name: 'order_id' })
  orderId: string;

  @OneToOne(() => OrdersEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: OrdersEntity;

  @Column({ type: 'uuid', name: 'courier_id', nullable: true })
  courierId: string | null;

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'courier_id' })
  courier: UserEntity | null;

  @Column({ type: 'double precision' })
  lat: number;

  @Column({ type: 'double precision' })
  lng: number;

  @Column({ type: 'timestamptz', name: 'last_updated' })
  lastUpdated: Date;
}
