import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { OrderStatus } from '../../constants';
import { OrderItemEntity } from './order-item.entity';
import { UserEntity } from '../user/user.entity';

@Entity('order')
export class OrdersEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @OneToMany(() => OrderItemEntity, (item) => item.order)
  items: OrderItemEntity[];

  @Column({
    type: 'enum',
    enum: OrderStatus,
    enumName: 'orders_status_enum',
    default: OrderStatus.CREATED,
  })
  status: OrderStatus;

  @Column({ type: 'uuid', name: 'courier_id', nullable: true })
  courierId: string | null;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'courier_id' })
  courier: UserEntity | null;

  @Column({ type: 'uuid', unique: true })
  idempotencyKey: string;

  @Column({ type: 'uuid', name: 'payment_id', nullable: true })
  paymentId: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  @Column({ type: 'timestamptz', name: 'processed_at', nullable: true })
  processedAt: Date | null;
}
